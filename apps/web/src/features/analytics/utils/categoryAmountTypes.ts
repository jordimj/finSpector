import type { TransactionType } from '@finance/shared';

export const categoryAmountTypes = [
  { key: 'expense', label: 'Expenses' },
  { key: 'income', label: 'Incomes' },
] satisfies Array<{ key: TransactionType; label: string }>;
