import { useQuery } from '@tanstack/react-query';
import { fetchRecentTransactions } from '../utils';

export type {
  RecentTransaction,
  RecentTransactionsResponse,
  TransactionType,
} from '../types';

export function useRecentTransactions() {
  return useQuery({
    queryKey: ['transactions', 'recent'],
    queryFn: fetchRecentTransactions,
  });
}
