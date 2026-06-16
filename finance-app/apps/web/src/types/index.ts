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

export type CategorySpendResponseCategory = {
  id: number | null;
  category: string;
  transactionCount: number;
  total: string;
};

export type CategorySpendResponse = {
  categories: CategorySpendResponseCategory[];
};

export type CategorySpendCategory = CategorySpendResponseCategory & {
  share: number;
  totalAmount: number;
};

export type CategorySpend = DateRange & {
  categories: CategorySpendCategory[];
  total: number;
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
