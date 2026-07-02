import { useQuery } from '@tanstack/react-query';
import type { TransactionType } from '@finance/shared';
import { fetchJson } from '../lib/api';

export type Category = {
  id: number;
  name: string;
  subcategories: Array<{
    id: number;
    name: string;
  }>;
};

export function useCategories(type?: TransactionType) {
  const queryString = type === undefined ? '' : `?type=${type}`;

  return useQuery({
    queryKey: ['categories', type ?? 'all'],
    queryFn: () =>
      fetchJson<Array<Category>>({
        path: `/api/categories${queryString}`,
      }),
  });
}
