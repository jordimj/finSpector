import { useQuery } from '@tanstack/react-query';
import { fetchIncomeVsExpenses, getCurrentMonthRange } from '../utils';
import type { ReportDateRange } from '../types';

export type {
  IncomeVsExpenses,
  IncomeVsExpensesAmounts,
  IncomeVsExpensesGroupBy,
  IncomeVsExpensesPeriod,
  IncomeVsExpensesResponse,
  IncomeVsExpensesResponsePeriod,
} from '../types';

export function useIncomeVsExpenses(
  range: ReportDateRange = getCurrentMonthRange(),
) {
  return useQuery({
    queryKey: [
      'reports',
      'income-vs-expenses',
      range.startDate ?? null,
      range.endDate ?? null,
    ],
    queryFn: () => fetchIncomeVsExpenses(range),
  });
}
