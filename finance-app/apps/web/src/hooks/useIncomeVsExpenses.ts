import { useQuery } from '@tanstack/react-query';
import { fetchIncomeVsExpenses, getCurrentMonthRange } from '../utils';
import type { ReportDateRange } from '../types';
import { useAccountFilter } from './useAccountFilter';

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
  const { selectedAccount } = useAccountFilter();

  return useQuery({
    queryKey: [
      'reports',
      'income-vs-expenses',
      range.startDate ?? null,
      range.endDate ?? null,
      selectedAccount,
    ],
    queryFn: () => fetchIncomeVsExpenses(range, selectedAccount),
  });
}
