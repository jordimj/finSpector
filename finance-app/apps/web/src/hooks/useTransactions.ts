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
  search?: string;
};

export function fetchTransactionsPage({
  limit,
  offset,
  selectedAccount,
  search,
}: FetchTransactionsPageOptions) {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  const descriptionSearch = search?.trim();

  if (descriptionSearch !== undefined && descriptionSearch !== '') {
    params.set('search', descriptionSearch);
  }

  appendAccountParam(params, selectedAccount);

  return fetchJson<TransactionsResponse>({
    path: `/api/transactions?${params.toString()}`,
  });
}

export function useTransactions(search = '') {
  const { selectedAccount } = useAccountFilter();
  const descriptionSearch = search.trim();

  return useInfiniteQuery({
    queryKey: ['transactions', 'history', selectedAccount, descriptionSearch],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      fetchTransactionsPage({
        limit: transactionsPageSize,
        offset: Number(pageParam),
        search: descriptionSearch,
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
