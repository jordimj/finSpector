import { useQuery } from '@tanstack/react-query';
import {
  fetchLastMonthExpenses,
  getLastMonthRange,
} from '../utils';
import { useAccountFilter } from './useAccountFilter';

export type {
  LastMonthExpensePoint,
  LastMonthExpenses,
} from '../types';

export function useLastMonthExpenses() {
  const { selectedAccount } = useAccountFilter();
  const range = getLastMonthRange();

  return useQuery({
    queryKey: [
      'expenses',
      'last-month',
      range.startDate,
      range.endDate,
      selectedAccount,
    ],
    queryFn: () => fetchLastMonthExpenses(range, selectedAccount),
  });
}
