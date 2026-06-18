import { useInfiniteQuery } from '@tanstack/react-query';
import type { Transaction } from '@finance/shared';
import { fetchJson } from '../lib/api';
import type { AccountFilter } from '../types';
import { appendAccountParam } from '../utils';
import { useAccountFilter } from './useAccountFilter';

const transactionsPageSize = 50;

export type TransactionsResponse = {
  transactions: Transaction[];
  limit: number;
  offset: number;
};

type FetchTransactionsPageOptions = {
  limit: number;
  offset: number;
  selectedAccount: AccountFilter;
};

export function fetchTransactionsPage({
  limit,
  offset,
  selectedAccount,
}: FetchTransactionsPageOptions) {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  appendAccountParam(params, selectedAccount);

  return fetchJson<TransactionsResponse>({
    path: `/api/transactions?${params.toString()}`,
  });
}

export function useTransactions() {
  const { selectedAccount } = useAccountFilter();

  return useInfiniteQuery({
    queryKey: ['transactions', 'history', selectedAccount],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      fetchTransactionsPage({
        limit: transactionsPageSize,
        offset: Number(pageParam),
        selectedAccount,
      }),
    getNextPageParam: (lastPage) => {
      if (lastPage.transactions.length < lastPage.limit) {
        return undefined;
      }

      return lastPage.offset + lastPage.transactions.length;
    },
  });
}
