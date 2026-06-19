import { EXPENSE_ACCOUNTS, TRANSACTION_TYPES } from './constants.js';

export type TransactionType = (typeof TRANSACTION_TYPES)[number];
export type ExpenseAccount = (typeof EXPENSE_ACCOUNTS)[number];

export type RawTransactionRow = {
  date: string;
  amount: string;
  description: string;
  category?: string;
  subcategory?: string;
  type?: string;
};

export type NormalizedTransaction = {
  date: string;
  amount: string;
  description?: string;
  categoryName: string;
  subcategoryName?: string;
  type: TransactionType;
};

export type Transaction = {
  id: string;
  date: string;
  amount: string;
  description: string | null;
  category: string;
  subcategory: string | null;
  account: ExpenseAccount | null;
  type: TransactionType;
};

export type ImportSummary = {
  importId: string;
  sourceName: string;
  totalRows: number;
  insertedExpenses: number;
  insertedIncome: number;
  duplicateRows: number;
  skippedRows: number;
};
