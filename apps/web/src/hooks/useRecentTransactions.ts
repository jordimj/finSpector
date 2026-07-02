import { useQuery } from '@tanstack/react-query';
import { useAccountFilter } from './useAccountFilter';
import { fetchTransactionsPage } from './useTransactions';

export function useRecentTransactions() {
  const { selectedAccount } = useAccountFilter();

  return useQuery({
    queryKey: ['transactions', 'recent', selectedAccount],
    queryFn: () =>
      fetchTransactionsPage({
        limit: 5,
        offset: 0,
        selectedAccount,
      }),
  });
}
