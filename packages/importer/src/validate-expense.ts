import type { NormalizedTransaction } from '@finance/shared';

export function validateTransaction(
  transaction: NormalizedTransaction,
): string[] {
  const errors: string[] = [];

  if (!transaction.date) {
    errors.push('date is required');
  }

  if (
    !Number.isFinite(Number(transaction.amount)) ||
    Number(transaction.amount) <= 0
  ) {
    errors.push('amount must be a positive number after normalization');
  }

  return errors;
}
