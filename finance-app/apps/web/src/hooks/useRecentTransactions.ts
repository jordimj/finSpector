import { useQuery } from '@tanstack/react-query';
import { useAccountFilter } from './useAccountFilter';
import { fetchRecentTransactions } from '../utils';

export function useRecentTransactions() {
  const { selectedAccount } = useAccountFilter();

  return useQuery({
    queryKey: ['transactions', 'recent', selectedAccount],
    queryFn: () => fetchRecentTransactions(selectedAccount),
  });
}
