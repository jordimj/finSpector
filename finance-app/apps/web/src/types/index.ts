import type { ExpenseAccount } from '@finance/shared';

export type DateRange = {
  startDate: string;
  endDate: string;
};

export type ReportDateRange = Partial<DateRange>;

export type AccountFilter = ExpenseAccount | null;
