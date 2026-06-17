import { useQuery } from '@tanstack/react-query';
import { fetchJson } from '../lib/api';

interface Category {
  id: number;
  name: string;
  subcategories: Array<{
    id: number;
    name: string;
  }>;
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () =>
      fetchJson<Array<Category>>({
        path: '/api/categories',
      }),
  });
}
