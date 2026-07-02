import type {
  PaymentOccurrenceState,
  PaymentReminderOccurrence,
} from '@finance/shared';
import { normalizePaymentMatchText } from './candidates.js';
import {
  cadenceMonthSteps,
  matchWindowDaysAfter,
  matchWindowDaysBefore,
} from './constants.js';
import {
  daysBetween,
  daysInMonth,
  formatDateKey,
  parseDateKey,
} from './date.js';
import { toMoneyText } from './money.js';
import type {
  PaymentMatchInput,
  PaymentReminderForOccurrence,
  UpcomingSummary,
} from './types.js';

export function generatePaymentReminderOccurrences(
  reminder: PaymentReminderForOccurrence,
  startDate: string,
  endDate: string,
  today: string,
): PaymentReminderOccurrence[] {
  const dueDates = generateCadencedDueDates(
    reminder.startDate > startDate ? reminder.startDate : startDate,
    endDate,
    reminder.dueDay,
    reminder.cadence,
    reminder.startDate,
  );

  return dueDates.map((dueDate) => ({
    account: reminder.account,
    amount: reminder.amount,
    amountTolerance: reminder.amountTolerance,
    category: reminder.category,
    categoryId: reminder.categoryId,
    dueDate,
    id: null,
    matchText: reminder.matchText,
    matchedExpenseId: null,
    paidAt: null,
    reminderId: reminder.id,
    reminderName: reminder.name,
    skippedAt: null,
    state: getOpenPaymentOccurrenceState(dueDate, today, reminder.leadDays),
    subcategory: reminder.subcategory,
    subcategoryId: reminder.subcategoryId,
  }));
}

export function getOpenPaymentOccurrenceState(
  dueDate: string,
  today: string,
  leadDays: number,
): PaymentOccurrenceState {
  if (dueDate < today) {
    return 'overdue';
  }

  if (daysBetween(today, dueDate) <= leadDays) {
    return 'dueSoon';
  }

  return 'upcoming';
}

export function isPaymentReminderExpenseMatch(
  reminder: Pick<
    PaymentReminderForOccurrence,
    'account' | 'amount' | 'amountTolerance' | 'categoryId' | 'subcategoryId'
  > & { matchText?: string | null },
  expense: PaymentMatchInput,
  dueDate: string,
): boolean {
  if (
    reminder.account !== expense.account ||
    reminder.categoryId !== expense.categoryId ||
    reminder.subcategoryId !== expense.subcategoryId
  ) {
    return false;
  }

  const amountDelta = Math.abs(Number(expense.amount) - Number(reminder.amount));

  if (amountDelta > Number(reminder.amountTolerance)) {
    return false;
  }

  const daysFromDueDate = daysBetween(dueDate, expense.date);

  if (
    daysFromDueDate < -matchWindowDaysBefore ||
    daysFromDueDate > matchWindowDaysAfter
  ) {
    return false;
  }

  const matchText =
    reminder.matchText === null || reminder.matchText === undefined
      ? ''
      : normalizePaymentMatchText(reminder.matchText);

  if (matchText.length === 0) {
    return true;
  }

  const expenseText = normalizePaymentMatchText(`${expense.description ?? ''} ${
    expense.bankConcept ?? ''
  }`);

  return expenseText.includes(matchText);
}

export function occurrenceKey({
  dueDate,
  reminderId,
}: {
  dueDate: string;
  reminderId: string;
}): string {
  return `${reminderId}:${dueDate}`;
}

export function summarizeOccurrences(
  occurrences: PaymentReminderOccurrence[],
  horizonDays: number,
): UpcomingSummary {
  const totals = {
    dueSoonCount: 0,
    overdueCount: 0,
    paidCount: 0,
    skippedCount: 0,
    upcomingCount: 0,
  };
  const totalOpenAmount = occurrences.reduce((sum, occurrence) => {
    if (occurrence.state === 'paid') {
      totals.paidCount += 1;
      return sum;
    }

    if (occurrence.state === 'skipped') {
      totals.skippedCount += 1;
      return sum;
    }

    if (occurrence.state === 'dueSoon') {
      totals.dueSoonCount += 1;
    } else if (occurrence.state === 'overdue') {
      totals.overdueCount += 1;
    } else {
      totals.upcomingCount += 1;
    }

    return sum + Number(occurrence.amount);
  }, 0);

  return {
    ...totals,
    horizonDays,
    totalOpenAmount: toMoneyText(totalOpenAmount),
  };
}

export function compareOccurrences(
  left: PaymentReminderOccurrence,
  right: PaymentReminderOccurrence,
): number {
  const leftRank = occurrenceStateRank(left.state);
  const rightRank = occurrenceStateRank(right.state);

  if (leftRank !== rightRank) {
    return leftRank - rightRank;
  }

  const dateCompare = left.dueDate.localeCompare(right.dueDate);

  if (dateCompare !== 0) {
    return dateCompare;
  }

  return left.reminderName.localeCompare(right.reminderName);
}

function generateCadencedDueDates(
  startDate: string,
  endDate: string,
  dueDay: number,
  cadence: PaymentReminderForOccurrence['cadence'],
  anchorDate: string,
): string[] {
  if (cadence === 'oneTime') {
    return anchorDate >= startDate && anchorDate <= endDate ? [anchorDate] : [];
  }

  const start = parseDateKey(startDate);
  const end = parseDateKey(endDate);
  const dueDates: string[] = [];
  const anchor = parseDateKey(anchorDate);
  const step = cadenceMonthSteps[cadence];
  let year = anchor.getFullYear();
  let month = anchor.getMonth();

  while (
    year < start.getFullYear() ||
    (year === start.getFullYear() && month < start.getMonth())
  ) {
    month += step;
    year += Math.floor(month / 12);
    month %= 12;
  }

  while (
    year < end.getFullYear() ||
    (year === end.getFullYear() && month <= end.getMonth())
  ) {
    const date = formatDateKey(
      new Date(year, month, Math.min(dueDay, daysInMonth(year, month))),
    );

    if (date >= startDate && date <= endDate) {
      dueDates.push(date);
    }

    month += step;
    year += Math.floor(month / 12);
    month %= 12;
  }

  return dueDates;
}

function occurrenceStateRank(state: PaymentOccurrenceState): number {
  const ranks = {
    overdue: 0,
    dueSoon: 1,
    upcoming: 2,
    paid: 3,
    skipped: 4,
  } satisfies Record<PaymentOccurrenceState, number>;

  return ranks[state];
}
