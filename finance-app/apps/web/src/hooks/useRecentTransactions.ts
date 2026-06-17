import { useQuery } from '@tanstack/react-query';
import type { Transaction } from '@finance/shared';
import { fetchJson } from '../lib/api';
import { appendAccountParam } from '../utils';
import { useAccountFilter } from './useAccountFilter';

const recentTransactionLimit = 10;

type RecentTransactionsResponse = {
  transactions: Transaction[];
  limit: number;
  offset: number;
};

export function useRecentTransactions() {
  const { selectedAccount } = useAccountFilter();

  return useQuery({
    queryKey: ['transactions', 'recent', selectedAccount],
    queryFn: () => {
      const params = new URLSearchParams({
        limit: String(recentTransactionLimit),
        offset: '0',
      });
      appendAccountParam(params, selectedAccount);

      return fetchJson<RecentTransactionsResponse>({
        path: `/api/transactions?${params.toString()}`,
      });
    },
  });
}
