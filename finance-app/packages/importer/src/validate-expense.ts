import type { NormalizedTransaction } from "@finance/shared";

export function validateTransaction(transaction: NormalizedTransaction): string[] {
  const errors: string[] = [];

  if (!transaction.date) {
    errors.push("date is required");
  }

  if (!Number.isFinite(Number(transaction.amount)) || Number(transaction.amount) <= 0) {
    errors.push("amount must be a positive number after normalization");
  }

  if (transaction.type === "income" && !transaction.description) {
    errors.push("description is required for income");
  }

  if (transaction.type === "income" && !transaction.counterpartyName) {
    errors.push("payer name is required for income");
  }

  return errors;
}
