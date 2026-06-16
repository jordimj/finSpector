import { Filter } from 'lucide-react';
import type { CategorySpendCategory } from '../types';
import { formatCurrency } from '../utils';
import { CategoryRows } from './CategoryRows';

type CategoriesCardProps = {
  categories: CategorySpendCategory[];
  isError: boolean;
  isLoading: boolean;
  periodLabel: string;
  total: number;
};

export function CategoriesCard({
  categories,
  isError,
  isLoading,
  periodLabel,
  total,
}: CategoriesCardProps) {
  return (
    <div className='overflow-hidden rounded-lg border border-line bg-panel shadow-shell'>
      <div className='flex flex-col gap-3 border-b border-line px-5 py-5 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h2 className='text-xl font-semibold tracking-normal text-ink'>
            Category breakdown
          </h2>
          <p className='mt-1 text-sm font-medium text-muted'>
            {isLoading ? 'Loading totals' : `${formatCurrency(total)} spent`} ·{' '}
            {periodLabel}
          </p>
        </div>
      </div>

      <div className='hidden grid-cols-[minmax(0,1.15fr)_minmax(7rem,0.55fr)_minmax(12rem,0.95fr)] gap-4 border-b border-line bg-panel-raised/35 px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-muted-strong md:grid'>
        <span>Category</span>
        <span className='text-right'>Spend</span>
        <span>Share / activity</span>
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
