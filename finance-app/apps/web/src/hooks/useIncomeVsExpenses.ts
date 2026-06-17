import { useQuery } from '@tanstack/react-query';
import { fetchJson } from '../lib/api';
import type { ReportDateRange } from '../types';
import { getCurrentMonthRange, toReportQueryString } from '../utils';
import { useAccountFilter } from './useAccountFilter';

type IncomeVsExpensesGroupBy = 'month' | 'year';

type IncomeVsExpensesAmounts = {
  income: string;
  expenses: string;
  net: string;
};

type IncomeVsExpensesResponsePeriod = IncomeVsExpensesAmounts & {
  period: string;
};

type IncomeVsExpensesResponse = {
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

export function useIncomeVsExpenses(
  range: ReportDateRange = getCurrentMonthRange(),
  categoryId?: number,
) {
  const { selectedAccount } = useAccountFilter();

  return useQuery({
    queryKey: [
      'reports',
      'income-vs-expenses',
      range.startDate ?? null,
      range.endDate ?? null,
      selectedAccount,
      categoryId ?? null,
    ],
    queryFn: async () => {
      const queryString = toReportQueryString(
        range,
        selectedAccount,
        categoryId,
      );

      const response = await fetchJson<IncomeVsExpensesResponse>({
        path: `/api/reports/income-vs-expenses${queryString ? `?${queryString}` : ''}`,
      });

      return {
        ...range,
        groupBy: response.groupBy,
        totals: response.totals,
        periods: response.periods.map((period) => ({
          ...period,
          label: formatIncomeVsExpensesPeriod(period.period, response.groupBy),
          incomeAmount: Number(period.income),
          expensesAmount: Number(period.expenses),
          netAmount: Number(period.net),
        })),
      };
    },
  });
}

function formatIncomeVsExpensesPeriod(
  period: string,
  groupBy: IncomeVsExpensesGroupBy,
) {
  if (groupBy === 'year') {
    return period;
  }

  const [year = 0, month = 1] = period.split('-').map(Number);

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    year: 'numeric',
  }).format(new Date(year, month - 1, 1));
}
