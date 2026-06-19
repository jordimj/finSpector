import { useQuery } from '@tanstack/react-query';
import { fetchJson } from '../lib/api';
import type { ReportDateRange } from '../types';
import { getCurrentMonthRange, toReportQueryString } from '../utils';
import { useAccountFilter } from './useAccountFilter';
import { TransactionType } from '@finance/shared';

type Category = {
  id: number | null;
  category: string;
  transactionCount: number;
  total: string;
};

export type CategorySpend = Category & {
  share: number;
  totalAmount: number;
};

export function useCategorySpend(
  range: ReportDateRange = getCurrentMonthRange(),
  categoryId?: number,
  type: TransactionType = 'expense',
  enabled: boolean = true,
) {
  const { selectedAccount } = useAccountFilter();

  return useQuery({
    queryKey: [
      'reports',
      'category-spend',
      range.startDate,
      range.endDate,
      selectedAccount,
      categoryId,
      type,
    ],
    enabled,
    queryFn: async () => {
      const params = new URLSearchParams(
        toReportQueryString(range, selectedAccount, categoryId),
      );
      params.set('type', type);
      const queryString = params.toString();

      const categories = await fetchJson<Category[]>({
        path: `/api/reports/category-spend${queryString ? `?${queryString}` : ''}`,
      });
      const total = categories.reduce(
        (sum, category) => sum + Number(category.total),
        0,
      );

      return {
        ...range,
        categories: categories.map((category) => {
          const totalAmount = Number(category.total);

          return {
            ...category,
            share: total > 0 ? totalAmount / total : 0,
            totalAmount,
          };
        }),
        total,
      };
    },
  });
}
