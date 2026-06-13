import type { NormalizedTransaction } from "@finance/shared";

export function validateTransaction(transaction: NormalizedTransaction): string[] {
  const errors: string[] = [];

  if (!transaction.date) {
    errors.push("date is required");
  }

  if (!Number.isFinite(Number(transaction.amount)) || Number(transaction.amount) <= 0) {
    errors.push("amount must be a positive number after normalization");
  }

  if (!transaction.originalDescription) {
    errors.push("description is required");
  }

  if (!transaction.merchantName) {
    errors.push("merchant name is required");
  }

  return errors;
}
