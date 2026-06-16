export type DateRange = {
  startDate: string;
  endDate: string;
};

export type ReportDateRange = {
  startDate?: string;
  endDate?: string;
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

export type CategorySpend = ReportDateRange & {
  categories: CategorySpendCategory[];
  total: number;
};

export type IncomeVsExpensesGroupBy = 'month' | 'year';

export type IncomeVsExpensesAmounts = {
  income: string;
  expenses: string;
  net: string;
};

export type IncomeVsExpensesResponsePeriod = IncomeVsExpensesAmounts & {
  period: string;
};

export type IncomeVsExpensesResponse = {
  groupBy: IncomeVsExpensesGroupBy;
  totals: IncomeVsExpensesAmounts;
  periods: IncomeVsExpensesResponsePeriod[];
};

export type IncomeVsExpensesPeriod = IncomeVsExpensesResponsePeriod & {
  label: string;
  incomeAmount: number;
  expensesAmount: number;
  netAmount: number;
};

export type IncomeVsExpenses = ReportDateRange & {
  groupBy: IncomeVsExpensesGroupBy;
  totals: IncomeVsExpensesAmounts;
  periods: IncomeVsExpensesPeriod[];
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
