import { useInfiniteQuery } from '@tanstack/react-query';
import type { Transaction, TransactionType } from '@finance/shared';
import { fetchJson } from '../lib/api';
import type { AccountFilter, ReportDateRange } from '../types';
import { appendAccountParam } from '../utils';
import { useAccountFilter } from './useAccountFilter';

const transactionsPageSize = 50;

export type TransactionTypeFilter = 'all' | TransactionType;

export type TransactionsResponse = {
  transactions: Transaction[];
  limit: number;
  offset: number;
};

export type TransactionFilters = {
  categoryId?: number;
  dateRange?: ReportDateRange;
  search?: string;
  subcategoryId?: number;
  type?: TransactionTypeFilter;
};

type FetchTransactionsPageOptions = {
  filters?: TransactionFilters;
  limit: number;
  offset: number;
  selectedAccount: AccountFilter;
};

export function fetchTransactionsPage({
  filters = {},
  limit,
  offset,
  selectedAccount,
}: FetchTransactionsPageOptions) {
  const params = new URLSearchParams({
    limit: String(limit),
    offset: String(offset),
  });
  const descriptionSearch = filters.search?.trim();

  if (descriptionSearch !== undefined && descriptionSearch !== '') {
    params.set('search', descriptionSearch);
  }

  if (filters.type !== undefined && filters.type !== 'all') {
    params.set('type', filters.type);
  }

  if (filters.dateRange?.startDate !== undefined) {
    params.set('from', filters.dateRange.startDate);
  }

  if (filters.dateRange?.endDate !== undefined) {
    params.set('to', filters.dateRange.endDate);
  }

  if (filters.categoryId !== undefined) {
    params.set('categoryId', String(filters.categoryId));
  }

  if (filters.subcategoryId !== undefined) {
    params.set('subcategoryId', String(filters.subcategoryId));
  }

  appendAccountParam(params, selectedAccount);

  return fetchJson<TransactionsResponse>({
    path: `/api/transactions?${params.toString()}`,
  });
}

export function useTransactions(filters: TransactionFilters = {}) {
  const { selectedAccount } = useAccountFilter();
  const descriptionSearch = filters.search?.trim() ?? '';
  const type = filters.type ?? 'all';
  const startDate = filters.dateRange?.startDate ?? null;
  const endDate = filters.dateRange?.endDate ?? null;
  const categoryId = filters.categoryId ?? null;
  const subcategoryId = filters.subcategoryId ?? null;

  return useInfiniteQuery({
    queryKey: [
      'transactions',
      'history',
      selectedAccount,
      descriptionSearch,
      type,
      startDate,
      endDate,
      categoryId,
      subcategoryId,
    ],
    initialPageParam: 0,
    queryFn: ({ pageParam }) =>
      fetchTransactionsPage({
        filters: {
          categoryId: filters.categoryId,
          dateRange: filters.dateRange,
          search: descriptionSearch,
          subcategoryId: filters.subcategoryId,
          type,
        },
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
