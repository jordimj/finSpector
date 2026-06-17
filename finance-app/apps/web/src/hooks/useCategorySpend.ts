import { useQuery } from '@tanstack/react-query';
import { fetchCategorySpend, getCurrentMonthRange } from '../utils';
import type { ReportDateRange } from '../types';
import { useAccountFilter } from './useAccountFilter';

export type {
  CategorySpend,
  CategorySpendCategory,
  CategorySpendResponse,
  CategorySpendResponseCategory,
} from '../types';

export function useCategorySpend(
  range: ReportDateRange = getCurrentMonthRange(),
  categoryId?: number,
) {
  const { selectedAccount } = useAccountFilter();

  return useQuery({
    queryKey: [
      'reports',
      'category-spend',
      range.startDate ?? null,
      range.endDate ?? null,
      selectedAccount,
      categoryId ?? null,
    ],
    queryFn: () => fetchCategorySpend(range, selectedAccount, categoryId),
  });
}
