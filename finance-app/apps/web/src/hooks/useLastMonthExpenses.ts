import { useQuery } from '@tanstack/react-query';
import {
  fetchLastMonthExpenses,
  getLastMonthRange,
} from '../utils';

export type {
  LastMonthExpensePoint,
  LastMonthExpenses,
} from '../types';

export function useLastMonthExpenses() {
  const range = getLastMonthRange();

  return useQuery({
    queryKey: ['expenses', 'last-month', range.startDate, range.endDate],
    queryFn: () => fetchLastMonthExpenses(range),
  });
}
