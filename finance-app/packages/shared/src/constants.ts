export const UNCATEGORIZED_CATEGORY = 'Uncategorized';

export const TRANSACTION_TYPES = ['expense', 'income'] as const;

export const PAYMENT_CADENCES = [
  'oneTime',
  'monthly',
  'quarterly',
  'annually',
] as const;

export const PAYMENT_REMINDER_SOURCES = ['manual', 'detected'] as const;

export const PAYMENT_OCCURRENCE_STATES = [
  'upcoming',
  'dueSoon',
  'overdue',
  'paid',
  'skipped',
] as const;

export const EXPENSE_ACCOUNTS = [
  'mine',
  'shared',
  'kids',
  'splitwise',
] as const;

export const DEFAULT_EXPENSE_ACCOUNT = 'mine';

export const DEFAULT_PAYMENT_REMINDER_HORIZON_DAYS = 30;
export const DEFAULT_PAYMENT_REMINDER_AMOUNT_TOLERANCE = 5;
export const DEFAULT_PAYMENT_REMINDER_LEAD_DAYS = 7;
export const DEFAULT_PAYMENT_REMINDER_CADENCE = 'monthly' satisfies
  (typeof PAYMENT_CADENCES)[number];

export const PERSONAL_HALF_SHARE_ACCOUNTS = [
  'shared',
  'kids',
  'splitwise',
] as const;

const personalHalfShareAccountSet: ReadonlySet<
  (typeof EXPENSE_ACCOUNTS)[number]
> = new Set(PERSONAL_HALF_SHARE_ACCOUNTS);

export function getPersonalTransactionShare(
  account: (typeof EXPENSE_ACCOUNTS)[number] | null | undefined,
) {
  return account && personalHalfShareAccountSet.has(account) ? 0.5 : 1;
}

export function getPersonalTransactionAmount(
  amount: number,
  account: (typeof EXPENSE_ACCOUNTS)[number] | null | undefined,
): number {
  return amount * getPersonalTransactionShare(account);
}
