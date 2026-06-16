import type { CategorySpendCategory } from '../types';
import { formatCurrency } from '../utils';
import { CategoryRows } from './CategoryRows';

type CategoriesCardProps = {
  categories: CategorySpendCategory[];
  isError: boolean;
  isLoading: boolean;
  total: number;
};

export function CategoriesCard({
  categories,
  isError,
  isLoading,
  total,
}: CategoriesCardProps) {
  return (
    <div className='rounded-lg border border-line bg-panel'>
      <div className='border-b border-line px-5 py-4'>
        <h2 className='text-sm font-semibold text-ink'>Categories</h2>
        <p className='mt-1 text-xs text-muted'>
          {isLoading ? 'Loading totals' : formatCurrency(total)}
        </p>
      </div>

      <CategoryRows
        categories={categories}
        isError={isError}
        isLoading={isLoading}
        total={total}
      />
    </div>
  );
}
