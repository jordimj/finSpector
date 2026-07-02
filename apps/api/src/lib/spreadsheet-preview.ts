import * as XLSX from 'xlsx';
import type { TransactionType } from '@finance/shared';
import {
  parseTransactionsFromPdfText,
  type ExtractedPdfTransaction,
} from './pdf-preview.js';

const maxPreviewSheets = 3;
const maxPreviewRowsPerSheet = 25;
const headerScanRowCount = 30;

type CellValue = string | number | boolean | Date | null | undefined;

type HeaderMapping = {
  headerRowIndex: number;
  dateColumn: number;
  descriptionColumn: number;
  conceptColumn?: number;
  amountColumn?: number;
  debitColumn?: number;
  creditColumn?: number;
};

type ColumnCandidate = {
  index: number;
  score: number;
};

type SelectedAmount = {
  value: string;
  type: TransactionType;
};

export type SpreadsheetPreview = {
  rows: ExtractedPdfTransaction[];
  textPreview: string;
};

export function parseTransactionsFromSpreadsheet(
  buffer: Buffer,
): SpreadsheetPreview {
  const workbook = XLSX.read(buffer, {
    cellDates: true,
    type: 'buffer',
  });
  const previewLines: string[] = [];
  const rows: ExtractedPdfTransaction[] = [];

  workbook.SheetNames.forEach((sheetName, sheetIndex) => {
    const worksheet = workbook.Sheets[sheetName];

    if (!worksheet) {
      return;
    }

    const sheetRows = sheetToRows(worksheet);

    if (sheetIndex < maxPreviewSheets) {
      previewLines.push(`# ${sheetName}`);
      previewLines.push(...buildSheetPreview(sheetRows));
    }

    const mappedRows = parseSheetWithHeaders(sheetName, sheetRows);

    if (mappedRows.length > 0) {
      rows.push(...mappedRows);
      return;
    }

    rows.push(...parseSheetAsText(sheetRows));
  });

  return {
    rows,
    textPreview: previewLines.join('\n'),
  };
}

function sheetToRows(worksheet: XLSX.WorkSheet): string[][] {
  const rows = XLSX.utils.sheet_to_json<CellValue[]>(worksheet, {
    blankrows: false,
    defval: '',
    header: 1,
    raw: false,
  });

  return rows.map((row) => row.map((value) => cellToText(value)));
}

function parseSheetWithHeaders(
  sheetName: string,
  rows: string[][],
): ExtractedPdfTransaction[] {
  const mapping = detectHeaderMapping(rows);

  if (!mapping) {
    return [];
  }

  return rows.slice(mapping.headerRowIndex + 1).flatMap((row, offset) => {
    const rowIndex = mapping.headerRowIndex + offset + 1;
    const transaction = parseMappedRow(sheetName, rowIndex, row, mapping);

    return transaction ? [transaction] : [];
  });
}

function detectHeaderMapping(rows: string[][]): HeaderMapping | null {
  let bestMapping: HeaderMapping | null = null;
  let bestScore = 0;

  rows.slice(0, headerScanRowCount).forEach((row, rowIndex) => {
    const dateCandidate = bestCandidate(
      row.map((cell, index) => ({
        index,
        score: scoreDateHeader(cell),
      })),
    );
    const descriptionCandidate = bestCandidate(
      row.map((cell, index) => ({
        index,
        score: scoreDescriptionHeader(cell),
      })),
    );
    const amountCandidate = bestCandidate(
      row.map((cell, index) => ({
        index,
        score: scoreAmountHeader(cell),
      })),
    );
    const conceptCandidate = bestCandidate(
      row.map((cell, index) => ({
        index,
        score: scoreConceptHeader(cell),
      })),
    );
    const debitCandidate = bestCandidate(
      row.map((cell, index) => ({
        index,
        score: scoreDebitHeader(cell),
      })),
    );
    const creditCandidate = bestCandidate(
      row.map((cell, index) => ({
        index,
        score: scoreCreditHeader(cell),
      })),
    );
    const hasAmount =
      amountCandidate || debitCandidate || creditCandidate ? true : false;

    if (!dateCandidate || !descriptionCandidate || !hasAmount) {
      return;
    }

    const score =
      dateCandidate.score +
      descriptionCandidate.score +
      (conceptCandidate?.score ?? 0) +
      (amountCandidate?.score ?? 0) +
      (debitCandidate?.score ?? 0) +
      (creditCandidate?.score ?? 0);

    if (score <= bestScore) {
      return;
    }

    bestScore = score;
    bestMapping = {
      headerRowIndex: rowIndex,
      dateColumn: dateCandidate.index,
      descriptionColumn: descriptionCandidate.index,
      conceptColumn: conceptCandidate?.index,
      amountColumn: amountCandidate?.index,
      debitColumn: debitCandidate?.index,
      creditColumn: creditCandidate?.index,
    };
  });

  return bestScore >= 6 ? bestMapping : null;
}

function parseMappedRow(
  sheetName: string,
  rowIndex: number,
  row: string[],
  mapping: HeaderMapping,
): ExtractedPdfTransaction | null {
  const date = normalizeSpreadsheetDate(row[mapping.dateColumn] ?? '');
  const selectedAmount = selectMappedAmount(row, mapping);
  const amount = normalizeSpreadsheetAmount(selectedAmount.value);
  const description = compactText(row[mapping.descriptionColumn] ?? '');
  const concept =
    mapping.conceptColumn === undefined
      ? undefined
      : compactText(row[mapping.conceptColumn] ?? '') || undefined;

  if (!date || !amount || !description) {
    return null;
  }

  return {
    date,
    description,
    concept,
    amount,
    type: selectedAmount.type,
    rawText: `${sheetName} R${rowIndex + 1}: ${row.join(' | ')}`,
  };
}

function selectMappedAmount(
  row: string[],
  mapping: HeaderMapping,
): SelectedAmount {
  if (mapping.amountColumn !== undefined) {
    const value = row[mapping.amountColumn] ?? '';

    return {
      value,
      type: inferTransactionTypeFromAmountText(value),
    };
  }

  const debit = row[mapping.debitColumn ?? -1] ?? '';
  const credit = row[mapping.creditColumn ?? -1] ?? '';

  if (debit.trim().length > 0) {
    return {
      value: debit,
      type: 'expense',
    };
  }

  return {
    value: credit,
    type: 'income',
  };
}

function parseSheetAsText(rows: string[][]): ExtractedPdfTransaction[] {
  const text = rows
    .map((row) => row.filter((cell) => cell.length > 0).join(' '))
    .join('\n');

  return parseTransactionsFromPdfText(text);
}

function buildSheetPreview(rows: string[][]): string[] {
  return rows
    .slice(0, maxPreviewRowsPerSheet)
    .map((row) => row.filter((cell) => cell.length > 0).join(' | '))
    .filter((line) => line.length > 0);
}

function bestCandidate(
  candidates: ColumnCandidate[],
): ColumnCandidate | null {
  const best = candidates
    .filter((candidate) => candidate.score > 0)
    .sort((left, right) => right.score - left.score)[0];

  return best ?? null;
}

function scoreDateHeader(value: string): number {
  const normalized = normalizeHeader(value);

  if (/\b(date|fecha|data)\b/.test(normalized)) {
    return normalized.includes('valor') || normalized.includes('value')
      ? 2
      : 3;
  }

  return 0;
}

function scoreDescriptionHeader(value: string): number {
  const normalized = normalizeHeader(value);

  if (
    /\b(descrip\w*|merchant|comercio|detalle|details|beneficiari\w*|ordenante|referencia)\b/.test(
      normalized,
    )
  ) {
    return 3;
  }

  if (/\b(movim|transaction|operacion)\b/.test(normalized)) {
    return 2;
  }

  return 0;
}

function scoreConceptHeader(value: string): number {
  const normalized = normalizeHeader(value);

  if (/\b(concept\w*)\b/.test(normalized)) {
    return 2;
  }

  return 0;
}

function scoreAmountHeader(value: string): number {
  const normalized = normalizeHeader(value);

  if (/\b(balance|saldo)\b/.test(normalized)) {
    return 0;
  }

  if (/\b(amount|importe|import|monto|quantitat|total)\b/.test(normalized)) {
    return 3;
  }

  return 0;
}

function scoreDebitHeader(value: string): number {
  const normalized = normalizeHeader(value);

  if (/\b(debit|debe|cargo|carrec|salida|pagado)\b/.test(normalized)) {
    return 2;
  }

  return 0;
}

function scoreCreditHeader(value: string): number {
  const normalized = normalizeHeader(value);

  if (/\b(credit|haber|abono|ingreso|entrada)\b/.test(normalized)) {
    return 2;
  }

  return 0;
}

function normalizeSpreadsheetDate(value: string): string | null {
  const trimmed = value.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const slashDate = trimmed.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);

  if (slashDate) {
    const day = slashDate[1] ?? '';
    const month = slashDate[2] ?? '';
    const yearValue = slashDate[3] ?? '';
    const year = yearValue.length === 2 ? `20${yearValue}` : yearValue;

    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  const parsed = new Date(trimmed);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString().slice(0, 10);
}

function normalizeSpreadsheetAmount(value: string): string | null {
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
    const amount = Number(stripped.replace(/[^\d-]/g, ''));

    return Number.isFinite(amount) ? Math.abs(amount).toFixed(2) : null;
  }

  const integerPart = stripped
    .slice(0, decimalSeparatorIndex)
    .replace(/\D/g, '');
  const decimalPart = stripped
    .slice(decimalSeparatorIndex + 1)
    .replace(/\D/g, '')
    .slice(0, 2);

  if (!integerPart || decimalPart.length === 0) {
    return null;
  }

  const amount = Number(
    `${isNegative ? '-' : ''}${integerPart}.${decimalPart.padEnd(2, '0')}`,
  );

  return Number.isFinite(amount) ? Math.abs(amount).toFixed(2) : null;
}

function inferTransactionTypeFromAmountText(value: string): TransactionType {
  return /[\-−]/.test(value) ? 'expense' : 'income';
}

function cellToText(value: CellValue): string {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  return value === null || value === undefined ? '' : String(value).trim();
}

function compactText(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

function normalizeHeader(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}
