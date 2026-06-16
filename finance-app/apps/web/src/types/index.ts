import type { ReactNode } from 'react';

export type DateRange = {
  startDate: string;
  endDate: string;
};

export type LastMonthExpensePoint = {
  date: string;
  label: string;
  amount: number;
};

export type LastMonthExpenses = DateRange & {
  total: number;
  dailyExpenses: LastMonthExpensePoint[];
};

export type ExpenseTransaction = {
  date: string;
  amount: string;
  type: 'expense';
};

export type ExpenseTransactionsResponse = {
  transactions: ExpenseTransaction[];
  limit: number;
  offset: number;
};

export type TransactionType = 'expense' | 'income';

export type RecentTransaction = {
  id: string;
  date: string;
  amount: string;
  name: string;
  originalDescription: string;
  category: string;
  subcategory: string | null;
  notes: string | null;
  account: string | null;
  type: TransactionType;
};

export type RecentTransactionsResponse = {
  transactions: RecentTransaction[];
  limit: number;
  offset: number;
};

export type SummaryTileProps = {
  label: string;
  value: string;
  icon: ReactNode;
};

export type LastMonthExpensesCardProps = {
  data?: LastMonthExpenses;
  isError: boolean;
  isLoading: boolean;
};

export type LastMonthExpenseChartProps = {
  data: LastMonthExpensePoint[];
  isError: boolean;
  isLoading: boolean;
};

export type RecentTransactionsCardProps = {
  isError: boolean;
  isLoading: boolean;
  transactions: RecentTransaction[];
};

export type RecentTransactionsListProps = RecentTransactionsCardProps;

export type TransactionRowProps = {
  transaction: RecentTransaction;
};

export type ChildrenProps = {
  children: ReactNode;
};

export type ElementSize = {
  width: number;
  height: number;
};
