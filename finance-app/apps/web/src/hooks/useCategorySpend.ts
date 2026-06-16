import { useQuery } from '@tanstack/react-query';
import { fetchCategorySpend, getCurrentMonthRange } from '../utils';
import type { ReportDateRange } from '../types';

export type {
  CategorySpend,
  CategorySpendCategory,
  CategorySpendResponse,
  CategorySpendResponseCategory,
} from '../types';

export function useCategorySpend(
  range: ReportDateRange = getCurrentMonthRange(),
) {
  return useQuery({
    queryKey: [
      'reports',
      'category-spend',
      range.startDate ?? null,
      range.endDate ?? null,
    ],
    queryFn: () => fetchCategorySpend(range),
  });
}
