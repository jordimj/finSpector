import { pool } from '@finance/db';
import type { ExpenseAccount, TransactionType } from '@finance/shared';
import { PDFParse } from 'pdf-parse';

const datePattern =
  /\b(\d{4}-\d{2}-\d{2}|\d{1,2}[./-]\d{1,2}[./-]\d{2,4})\b/;
const amountPattern =
  /[-+−]?\s*(?:(?:EUR|CHF|USD|€)\s*)?(?:\d{1,3}(?:[.'\s]\d{3})+|\d+)[,.]\d{2}\s*(?:EUR|CHF|USD|€)?/gi;
const suggestionThreshold = 0.55;
const minimumDescriptionScore = 0.35;
const splitwiseSkipWindowDays = 14;
const maxTextPreviewLength = 4000;
const maxTextPreviewLines = 80;

export type ExtractedPdfTransaction = {
  date: string;
  description: string;
  concept?: string;
  amount: string;
  type: TransactionType;
  rawText: string;
};

export type HistoricalTransaction = {
  id: string;
  date: string;
  amount: string;
  description: string | null;
  bankConcept?: string | null;
  category: string;
  subcategory: string | null;
  account: ExpenseAccount | null;
  type: TransactionType;
};

export type PdfPreviewRow = ExtractedPdfTransaction & {
  suggestedDescription: string | null;
  suggestedCategory: string | null;
  suggestedSubcategory: string | null;
  confidence: number;
  matchedDescription: string | null;
  matchedAmount: string | null;
  matchedDate: string | null;
  matchReason: string;
  skipped?: boolean;
};

type AmountMatch = {
  text: string;
  index: number;
};

type HistoricalTransactionRow = {
  id: string;
  date: string;
  amount: string;
  description: string | null;
  bank_concept: string | null;
  category: string;
  subcategory: string | null;
  account: ExpenseAccount | null;
  type: TransactionType;
};

type DateMatch = {
  text: string;
  index: number;
};

type MatchSource = 'bankConcept' | 'description';

type ScoredCandidate = {
  candidate: HistoricalTransaction;
  descriptionScore: number;
  amountMatches: boolean;
  confidence: number;
  matchedText: string;
  source: MatchSource;
};

export async function extractPdfText(buffer: Buffer): Promise<string> {
  const parser = new PDFParse({ data: new Uint8Array(buffer) });

  try {
    const result = await parser.getText();
    return result.text;
  } finally {
    await parser.destroy();
  }
}

export function parseTransactionsFromPdfText(
  text: string,
): ExtractedPdfTransaction[] {
  const rows: ExtractedPdfTransaction[] = [];
  let currentBlock: string[] = [];

  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/\s+/g, ' ').trim();

    if (isIgnorablePdfLine(line)) {
      continue;
    }

    const lineHasDate = hasDate(line);
    const currentBlockHasDate = blockHasDate(currentBlock);
    const currentBlockHasAmount = blockHasAmount(currentBlock);

    if (
      lineHasDate &&
      currentBlock.length > 0 &&
      currentBlockHasDate &&
      currentBlockHasAmount
    ) {
      appendParsedBlock(rows, currentBlock);
      currentBlock = [line];
      continue;
    }

    if (lineHasDate && currentBlock.length > 0 && !currentBlockHasDate) {
      currentBlock = [line];
      continue;
    }

    if (currentBlock.length === 0 && !lineHasDate) {
      continue;
    }

    currentBlock.push(line);
  }

  appendParsedBlock(rows, currentBlock);

  return rows.filter((row) => row.description.length > 0);
}

export function buildPdfTextPreview(text: string): string {
  const preview = text
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line.length > 0)
    .slice(0, maxTextPreviewLines)
    .join('\n');

  if (preview.length <= maxTextPreviewLength) {
    return preview;
  }

  return `${preview.slice(0, maxTextPreviewLength)}...`;
}

export async function fetchHistoricalTransactions(): Promise<
  HistoricalTransaction[]
> {
  const result = await pool.query<HistoricalTransactionRow>(
    `
      with transactions as (
        select
          expenses.id,
          expenses.date,
          expenses.amount,
          expenses.description,
          expenses.bank_concept,
          categories.name as category,
          subcategories.name as subcategory,
          expenses.account,
          'expense' as type
        from expenses
        join categories on categories.id = expenses.category_id
        left join subcategories on subcategories.id = expenses.subcategory_id

        union all

        select
          income.id,
          income.date,
          income.amount,
          income.description,
          income.bank_concept,
          categories.name as category,
          subcategories.name as subcategory,
          income.account,
          'income' as type
        from income
        join categories on categories.id = income.category_id
        left join subcategories on subcategories.id = income.subcategory_id
      )
      select
        id,
        to_char(date, 'YYYY-MM-DD') as date,
        amount::numeric(12, 2)::text as amount,
        description,
        bank_concept,
        category,
        subcategory,
        account,
        type
      from transactions
      where (description is not null and btrim(description) <> '')
        or (bank_concept is not null and btrim(bank_concept) <> '')
      order by date desc;
    `,
  );

  return result.rows.flatMap((row) =>
    row.description || row.bank_concept
      ? [
          {
            id: row.id,
            date: row.date,
            amount: row.amount,
            description: row.description,
            bankConcept: row.bank_concept,
            category: row.category,
            subcategory: row.subcategory,
            account: row.account,
            type: row.type,
          },
        ]
      : [],
  );
}

export function toPdfPreviewRows(
  rows: ExtractedPdfTransaction[],
  history: HistoricalTransaction[],
): PdfPreviewRow[] {
  return rows.map((row) => suggestTransactionCategory(row, history));
}

export function suggestTransactionCategory(
  row: ExtractedPdfTransaction,
  history: HistoricalTransaction[],
): PdfPreviewRow {
  const splitwiseMatch = findSplitwiseSkipMatch(row, history);

  if (splitwiseMatch) {
    return {
      ...row,
      suggestedDescription: null,
      suggestedCategory: null,
      suggestedSubcategory: null,
      confidence: 100,
      matchedDescription:
        splitwiseMatch.description ?? splitwiseMatch.bankConcept ?? null,
      matchedAmount: splitwiseMatch.amount,
      matchedDate: splitwiseMatch.date,
      matchReason: `Splitwise exact amount within ${splitwiseSkipWindowDays} days`,
      skipped: true,
    };
  }

  const bestMatch =
    findBestMatch(row, history, 'bankConcept') ??
    findBestMatch(row, history, 'description');

  if (!bestMatch) {
    return {
      ...row,
      suggestedDescription: null,
      suggestedCategory: null,
      suggestedSubcategory: null,
      confidence: 0,
      matchedDescription: null,
      matchedAmount: null,
      matchedDate: null,
      matchReason: 'No similar historical description found',
    };
  }

  const confidence = Math.round(bestMatch.confidence * 100);
  const isConfident = bestMatch.confidence >= suggestionThreshold;

  return {
    ...row,
    suggestedDescription: isConfident
      ? bestMatch.candidate.description
      : null,
    suggestedCategory: isConfident ? bestMatch.candidate.category : null,
    suggestedSubcategory: isConfident
      ? bestMatch.candidate.subcategory
      : null,
    confidence,
    matchedDescription: bestMatch.matchedText,
    matchedAmount: bestMatch.candidate.amount,
    matchedDate: bestMatch.candidate.date,
    matchReason: buildMatchReason(bestMatch, isConfident),
  };
}

function appendParsedBlock(
  rows: ExtractedPdfTransaction[],
  block: string[],
): void {
  const parsed = parseTransactionBlock(block);

  if (parsed) {
    rows.push(parsed);
  }
}

function parseTransactionBlock(
  block: string[],
): ExtractedPdfTransaction | null {
  const blockText = compactDescription(block.join(' '));
  const dateMatches = findDates(blockText);
  const amountMatches = findAmounts(blockText);
  const firstDate = dateMatches[0];
  const amountMatch = selectTransactionAmount(amountMatches);

  if (!firstDate || !amountMatch) {
    return null;
  }

  const date = normalizePdfDate(firstDate.text);
  const amount = normalizePdfAmount(amountMatch.text);

  if (!date || !amount) {
    return null;
  }

  const description = compactDescription(
    removeRanges(blockText, [
      ...dateMatches.map((match) => ({
        start: match.index,
        end: match.index + match.text.length,
      })),
      ...amountMatches.map((match) => ({
        start: match.index,
        end: match.index + match.text.length,
      })),
    ]),
  );

  return {
    date,
    description,
    amount,
    type: inferTransactionTypeFromAmountText(amountMatch.text),
    rawText: block.join('\n'),
  };
}

function findDates(value: string): DateMatch[] {
  const dateSearchPattern = new RegExp(datePattern.source, 'g');

  return [...value.matchAll(dateSearchPattern)].flatMap((match) =>
    match.index !== undefined && match[1]
      ? [
          {
            text: match[1],
            index: match.index,
          },
        ]
      : [],
  );
}

function findAmounts(value: string): AmountMatch[] {
  const matches = [...value.matchAll(amountPattern)].flatMap((match) =>
    match.index !== undefined && match[0]
      ? [
          {
            text: match[0],
            index: match.index,
          },
        ]
      : [],
  );

  amountPattern.lastIndex = 0;

  return matches;
}

function selectTransactionAmount(matches: AmountMatch[]): AmountMatch | null {
  const signedMatches = matches.filter((match) => /[+\-−]/.test(match.text));
  const signedMatch = signedMatches.at(-1);

  return signedMatch ?? matches.at(-1) ?? null;
}

function inferTransactionTypeFromAmountText(value: string): TransactionType {
  return /[\-−]/.test(value) ? 'expense' : 'income';
}

function normalizePdfDate(value: string): string | null {
  const trimmed = value.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const parts = trimmed.split(/[./-]/);

  if (parts.length !== 3) {
    return null;
  }

  const [firstPart, secondPart, thirdPart] = parts;

  if (!firstPart || !secondPart || !thirdPart) {
    return null;
  }

  const day = firstPart.padStart(2, '0');
  const month = secondPart.padStart(2, '0');
  const year =
    thirdPart.length === 2 ? `20${thirdPart}` : thirdPart.padStart(4, '0');

  if (!isValidDateParts(year, month, day)) {
    return null;
  }

  return `${year}-${month}-${day}`;
}

function normalizePdfAmount(value: string): string | null {
  const normalizedMinus = value.replaceAll('−', '-');
  const isNegative = normalizedMinus.includes('-');
  const stripped = normalizedMinus
    .replace(/EUR|CHF|USD|€/gi, '')
    .replaceAll("'", '')
    .replace(/\s/g, '')
    .replace(/[^\d,.-]/g, '');
  const decimalSeparatorIndex = Math.max(
    stripped.lastIndexOf(','),
    stripped.lastIndexOf('.'),
  );

  if (decimalSeparatorIndex === -1) {
    return null;
  }

  const integerPart = stripped
    .slice(0, decimalSeparatorIndex)
    .replace(/\D/g, '');
  const decimalPart = stripped
    .slice(decimalSeparatorIndex + 1)
    .replace(/\D/g, '')
    .slice(0, 2);

  if (!integerPart || decimalPart.length !== 2) {
    return null;
  }

  const amount = Number(
    `${isNegative ? '-' : ''}${integerPart}.${decimalPart}`,
  );

  if (!Number.isFinite(amount)) {
    return null;
  }

  return Math.abs(amount).toFixed(2);
}

function isValidDateParts(year: string, month: string, day: string): boolean {
  const yearNumber = Number(year);
  const monthNumber = Number(month);
  const dayNumber = Number(day);

  if (
    !Number.isInteger(yearNumber) ||
    !Number.isInteger(monthNumber) ||
    !Number.isInteger(dayNumber)
  ) {
    return false;
  }

  if (yearNumber < 1900 || monthNumber < 1 || monthNumber > 12) {
    return false;
  }

  const date = new Date(Date.UTC(yearNumber, monthNumber - 1, dayNumber));

  return (
    date.getUTCFullYear() === yearNumber &&
    date.getUTCMonth() === monthNumber - 1 &&
    date.getUTCDate() === dayNumber
  );
}

function hasDate(line: string): boolean {
  return datePattern.test(line);
}

function blockHasDate(block: string[]): boolean {
  return block.some((line) => hasDate(line));
}

function blockHasAmount(block: string[]): boolean {
  return block.some((line) => findAmounts(line).length > 0);
}

function isIgnorablePdfLine(line: string): boolean {
  if (line.length === 0) {
    return true;
  }

  const normalized = normalizeDescriptionForMatch(line);

  return (
    /^--\s*\d+\s+of\s+\d+\s*--$/.test(line) ||
    /^(page|pagina|pagina|página)\s+\d+/.test(normalized) ||
    /\b(iban|bic|saldo|balance|extracto|statement|movimientos)\b/.test(
      normalized,
    ) ||
    /\b(date|fecha|data|concepto|descripcio|descripcion|importe|amount)\b/.test(
      normalized,
    )
  );
}

function removeRanges(
  value: string,
  ranges: Array<{ start: number; end: number }>,
): string {
  return [...ranges]
    .sort((left, right) => right.start - left.start)
    .reduce(
      (updatedValue, range) =>
        `${updatedValue.slice(0, range.start)} ${updatedValue.slice(range.end)}`,
      value,
    );
}

function compactDescription(value: string): string {
  return value.replace(/\s+/g, ' ').replace(/\s+([,.;:])/g, '$1').trim();
}

function findBestMatch(
  row: ExtractedPdfTransaction,
  history: HistoricalTransaction[],
  source: MatchSource,
): ScoredCandidate | null {
  const matches = history
    .flatMap((candidate) => {
      const match = scoreCandidate(row, candidate, source);

      return match === null ? [] : [match];
    })
    .filter((match) => match.descriptionScore >= minimumDescriptionScore)
    .sort((left, right) => right.confidence - left.confidence);

  return matches[0] ?? null;
}

function findSplitwiseSkipMatch(
  row: ExtractedPdfTransaction,
  history: HistoricalTransaction[],
): HistoricalTransaction | null {
  const rowDate = parseDateKey(row.date);

  if (rowDate === null) {
    return null;
  }

  return (
    history
      .filter((candidate) => {
        if (candidate.account !== 'splitwise' || candidate.amount !== row.amount) {
          return false;
        }

        const candidateDate = parseDateKey(candidate.date);

        if (candidateDate === null) {
          return false;
        }

        const daysAfterRow = daysBetweenUtcDates(rowDate, candidateDate);

        return daysAfterRow >= 0 && daysAfterRow <= splitwiseSkipWindowDays;
      })
      .sort(
        (left, right) =>
          daysBetweenUtcDates(rowDate, parseDateKey(left.date) ?? rowDate) -
          daysBetweenUtcDates(rowDate, parseDateKey(right.date) ?? rowDate),
      )[0] ?? null
  );
}

function parseDateKey(value: string): Date | null {
  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (!isValidDateParts(String(year), String(month), String(day))) {
    return null;
  }

  return new Date(Date.UTC(year, month - 1, day));
}

function daysBetweenUtcDates(startDate: Date, endDate: Date): number {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  return Math.round(
    (endDate.getTime() - startDate.getTime()) / millisecondsPerDay,
  );
}

function scoreCandidate(
  row: ExtractedPdfTransaction,
  candidate: HistoricalTransaction,
  source: MatchSource,
): ScoredCandidate | null {
  const matchedText =
    source === 'bankConcept' ? candidate.bankConcept : candidate.description;

  if (!matchedText) {
    return null;
  }

  const descriptionScore = descriptionSimilarity(
    row.description,
    matchedText,
  );
  const amountMatches = row.amount === candidate.amount;
  const confidence = Math.min(
    1,
    descriptionScore * 0.82 + (amountMatches ? 0.18 : 0),
  );

  return {
    candidate,
    descriptionScore,
    amountMatches,
    confidence,
    matchedText,
    source,
  };
}

function buildMatchReason(
  match: ScoredCandidate,
  isConfident: boolean,
): string {
  const label = match.source === 'bankConcept' ? 'bank concept' : 'description';
  const parts = [
    `${label} ${Math.round(match.descriptionScore * 100)}%`,
  ];

  if (match.amountMatches) {
    parts.push('exact amount');
  }

  if (!isConfident) {
    parts.push('below suggestion threshold');
  }

  return parts.join(', ');
}

function descriptionSimilarity(left: string, right: string): number {
  const leftNormalized = normalizeDescriptionForMatch(left);
  const rightNormalized = normalizeDescriptionForMatch(right);

  if (leftNormalized.length === 0 || rightNormalized.length === 0) {
    return 0;
  }

  if (leftNormalized === rightNormalized) {
    return 1;
  }

  const substringScore =
    leftNormalized.includes(rightNormalized) ||
    rightNormalized.includes(leftNormalized)
      ? 0.88
      : 0;
  const tokenScore = tokenJaccard(leftNormalized, rightNormalized);
  const diceScore = diceCoefficient(leftNormalized, rightNormalized);

  return Math.max(substringScore, tokenScore * 0.65 + diceScore * 0.35);
}

function normalizeDescriptionForMatch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function tokenJaccard(left: string, right: string): number {
  const leftTokens = toTokenSet(left);
  const rightTokens = toTokenSet(right);

  if (leftTokens.size === 0 || rightTokens.size === 0) {
    return 0;
  }

  let intersectionSize = 0;

  for (const token of leftTokens) {
    if (rightTokens.has(token)) {
      intersectionSize += 1;
    }
  }

  const unionSize = new Set([...leftTokens, ...rightTokens]).size;

  return unionSize === 0 ? 0 : intersectionSize / unionSize;
}

function toTokenSet(value: string): Set<string> {
  return new Set(value.split(' ').filter((token) => token.length >= 2));
}

function diceCoefficient(left: string, right: string): number {
  const leftBigrams = toBigrams(left);
  const rightBigrams = toBigrams(right);

  if (leftBigrams.length === 0 || rightBigrams.length === 0) {
    return 0;
  }

  const rightCounts = new Map<string, number>();

  for (const bigram of rightBigrams) {
    rightCounts.set(bigram, (rightCounts.get(bigram) ?? 0) + 1);
  }

  let intersectionSize = 0;

  for (const bigram of leftBigrams) {
    const count = rightCounts.get(bigram) ?? 0;

    if (count > 0) {
      intersectionSize += 1;
      rightCounts.set(bigram, count - 1);
    }
  }

  return (2 * intersectionSize) / (leftBigrams.length + rightBigrams.length);
}

function toBigrams(value: string): string[] {
  const compacted = value.replace(/\s+/g, ' ');

  if (compacted.length < 2) {
    return [];
  }

  const bigrams: string[] = [];

  for (let index = 0; index < compacted.length - 1; index += 1) {
    bigrams.push(compacted.slice(index, index + 2));
  }

  return bigrams;
}
