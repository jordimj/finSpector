import { useQuery } from '@tanstack/react-query';
import { fetchCategorySpend, getCurrentMonthRange } from '../utils';

export type {
  CategorySpend,
  CategorySpendCategory,
  CategorySpendResponse,
  CategorySpendResponseCategory,
} from '../types';

export function useCategorySpend() {
  const range = getCurrentMonthRange();

  return useQuery({
    queryKey: ['reports', 'category-spend', range.startDate, range.endDate],
    queryFn: () => fetchCategorySpend(range),
  });
}
