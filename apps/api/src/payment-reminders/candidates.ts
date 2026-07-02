import { createHash } from 'node:crypto';
import {
  DEFAULT_PAYMENT_REMINDER_AMOUNT_TOLERANCE,
  type ExpenseAccount,
  type PaymentCadence,
  type PaymentReminderCandidate,
} from '@finance/shared';
import {
  cadenceMonthSteps,
  candidateMinimumRows,
  candidateMinimumSpanMonths,
  candidateRecencyLimitDays,
} from './constants.js';
import {
  daysBetween,
  daysInMonth,
  formatDateKey,
  monthDistance,
  parseDateKey,
} from './date.js';
import { toMoneyText } from './money.js';
import type { CandidateExpenseInput } from './types.js';

export function detectPaymentReminderCandidates(
  rows: CandidateExpenseInput[],
  existingKeys: ReadonlySet<string> = new Set(),
  dismissedKeys: ReadonlySet<string> = new Set(),
  today = formatDateKey(new Date()),
): PaymentReminderCandidate[] {
  const groupedRows = new Map<string, CandidateExpenseInput[]>();
  const newestDate = rows.reduce(
    (latest, row) => (row.date > latest ? row.date : latest),
    '',
  );
  const activityAnchorDate = newestDate === '' ? today : newestDate;

  for (const row of rows) {
    const rawMatchText = row.description ?? row.bankConcept ?? '';
    const matchText = normalizePaymentMatchText(rawMatchText);

    if (matchText.length === 0) {
      continue;
    }

    const groupKey = toCandidateGroupKey({
      account: row.account,
      categoryId: row.categoryId,
      matchText,
      subcategoryId: row.subcategoryId,
    });

    const group = groupedRows.get(groupKey) ?? [];
    group.push({
      ...row,
      description: matchText,
    });
    groupedRows.set(groupKey, group);
  }

  return Array.from(groupedRows.entries())
    .flatMap(([, group]) =>
      toPaymentReminderCandidate(
        group,
        today,
        activityAnchorDate,
        existingKeys,
        dismissedKeys,
      ),
    )
    .sort((left, right) => {
      if (right.confidence !== left.confidence) {
        return right.confidence - left.confidence;
      }

      return right.lastPaidDate.localeCompare(left.lastPaidDate);
    });
}

export function toReminderCandidateKey({
  account,
  cadence = 'monthly',
  categoryId,
  matchText,
  subcategoryId,
}: {
  account: ExpenseAccount;
  cadence?: PaymentCadence;
  categoryId: number;
  matchText: string;
  subcategoryId: number | null;
}): string {
  const normalizedMatchText = normalizePaymentMatchText(matchText);
  const digest = createHash('sha1')
    .update(normalizedMatchText)
    .digest('hex')
    .slice(0, 12);

  return [
    cadence,
    account,
    String(categoryId),
    subcategoryId === null ? 'none' : String(subcategoryId),
    digest,
  ].join(':');
}

export function normalizePaymentMatchText(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .replace(/\b\d{1,4}\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .slice(0, 80);
}

function toPaymentReminderCandidate(
  rows: CandidateExpenseInput[],
  today: string,
  newestDate: string,
  existingKeys: ReadonlySet<string>,
  dismissedKeys: ReadonlySet<string>,
): PaymentReminderCandidate[] {
  const sortedRows = [...rows].sort((left, right) =>
    left.date.localeCompare(right.date),
  );
  const months = Array.from(
    new Set(sortedRows.map((row) => row.date.slice(0, 7))),
  ).sort();
  const cadence = inferCandidateCadence(months, rows.length);

  const firstRow = sortedRows[0];
  const lastRow = sortedRows.at(-1);

  if (firstRow === undefined || lastRow === undefined || cadence === null) {
    return [];
  }

  if (rows.length < candidateMinimumRows[cadence]) {
    return [];
  }

  if (daysBetween(lastRow.date, newestDate) > candidateRecencyLimitDays[cadence]) {
    return [];
  }

  if (
    monthDistance(firstRow.date.slice(0, 7), lastRow.date.slice(0, 7)) <
    candidateMinimumSpanMonths[cadence]
  ) {
    return [];
  }

  const key = toReminderCandidateKey({
    account: lastRow.account,
    cadence,
    categoryId: lastRow.categoryId,
    matchText: lastRow.description ?? '',
    subcategoryId: lastRow.subcategoryId,
  });

  if (existingKeys.has(key) || dismissedKeys.has(key)) {
    return [];
  }

  const amounts = sortedRows.map((row) => Number(row.amount));
  const medianAmount = median(amounts);
  const maxDeviation = amounts.reduce(
    (max, amount) => Math.max(max, Math.abs(amount - medianAmount)),
    0,
  );
  const allowedDeviation = Math.max(
    DEFAULT_PAYMENT_REMINDER_AMOUNT_TOLERANCE,
    medianAmount * 0.1,
  );

  if (maxDeviation > allowedDeviation) {
    return [];
  }

  const dueDay = Math.round(
    median(sortedRows.map((row) => Number(row.date.slice(8, 10)))),
  );
  const stabilityScore = Math.max(0, 1 - maxDeviation / allowedDeviation);
  const confidence = Math.min(
    0.95,
    0.5 + months.length * 0.08 + rows.length * 0.025 + stabilityScore * 0.12,
  );

  return [
    {
      account: lastRow.account,
      amount: toMoneyText(medianAmount),
      amountTolerance: toMoneyText(Math.max(2, medianAmount * 0.05)),
      cadence,
      category: lastRow.category,
      categoryId: lastRow.categoryId,
      confidence: Number(confidence.toFixed(2)),
      dueDay,
      key,
      lastPaidDate: lastRow.date,
      matchText: lastRow.description ?? '',
      monthCount: months.length,
      name: formatCandidateName(lastRow.description ?? lastRow.category),
      nextDueDate: getNextDueDate(today, dueDay, cadence, lastRow.date),
      subcategory: lastRow.subcategory,
      subcategoryId: lastRow.subcategoryId,
      transactionCount: rows.length,
    },
  ];
}

function getNextDueDate(
  today: string,
  dueDay: number,
  cadence: PaymentCadence,
  anchorDate: string,
): string {
  if (cadence === 'oneTime') {
    return anchorDate;
  }

  const anchor = parseDateKey(anchorDate);
  const step = cadenceMonthSteps[cadence];
  let year = anchor.getFullYear();
  let month = anchor.getMonth();

  while (true) {
    const dueDate = formatDateKey(
      new Date(year, month, Math.min(dueDay, daysInMonth(year, month))),
    );

    if (dueDate >= today) {
      return dueDate;
    }

    month += step;
    year += Math.floor(month / 12);
    month %= 12;
  }
}

function inferCandidateCadence(
  sortedMonths: string[],
  rowCount: number,
): PaymentCadence | null {
  if (sortedMonths.length < 2) {
    return null;
  }

  const gaps = sortedMonths.slice(1).flatMap((month, index) => {
    const previousMonth = sortedMonths[index];

    return previousMonth === undefined
      ? []
      : [monthDistance(previousMonth, month)];
  });
  const medianGap = median(gaps);

  if (medianGap >= 10 && medianGap <= 14 && rowCount >= 2) {
    return 'annually';
  }

  if (medianGap >= 2 && medianGap <= 4 && rowCount >= 3) {
    return 'quarterly';
  }

  if (medianGap >= 1 && medianGap < 2 && rowCount >= 3) {
    return 'monthly';
  }

  return null;
}

function toCandidateGroupKey({
  account,
  categoryId,
  matchText,
  subcategoryId,
}: {
  account: ExpenseAccount;
  categoryId: number;
  matchText: string;
  subcategoryId: number | null;
}): string {
  return [
    account,
    String(categoryId),
    subcategoryId === null ? 'none' : String(subcategoryId),
    normalizePaymentMatchText(matchText),
  ].join(':');
}

function median(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  const sortedValues = [...values].sort((left, right) => left - right);
  const midpoint = Math.floor(sortedValues.length / 2);
  const middle = sortedValues[midpoint] ?? 0;

  if (sortedValues.length % 2 === 1) {
    return middle;
  }

  return ((sortedValues[midpoint - 1] ?? middle) + middle) / 2;
}

function formatCandidateName(value: string): string {
  const normalized = value.trim().replace(/\s+/g, ' ');

  if (normalized.length === 0) {
    return 'Recurring payment';
  }

  const lowerCased = normalized.toLocaleLowerCase();

  return lowerCased.charAt(0).toLocaleUpperCase() + lowerCased.slice(1);
}
