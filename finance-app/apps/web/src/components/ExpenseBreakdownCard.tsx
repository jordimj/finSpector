import { PieChart } from 'lucide-react';
import type { CategorySpendCategory } from '../types';
import { formatCurrency, formatPercentage } from '../utils';
import { getCategoryColor } from './categoryVisuals';
import { CategorySpendChart } from './CategorySpendChart';

type ExpenseBreakdownCardProps = {
  categories: CategorySpendCategory[];
  isError: boolean;
  isLoading: boolean;
  periodLabel: string;
  total: number;
};

export function ExpenseBreakdownCard({
  categories,
  isError,
  isLoading,
  periodLabel,
  total,
}: ExpenseBreakdownCardProps) {
  const legendCategories = categories.slice(0, 4);

  return (
    <div className='flex min-h-[34rem] flex-col rounded-lg border border-line bg-panel p-5 shadow-shell'>
      <div className='mb-5 flex items-start justify-between gap-3'>
        <div>
          <h2 className='text-xl font-semibold tracking-normal text-ink'>
            Category allocation
          </h2>
          <p className='mt-1 text-sm font-medium text-muted'>
            Total spend: {isLoading ? 'Loading totals' : formatCurrency(total)}
          </p>
        </div>
        <span className='flex size-9 shrink-0 items-center justify-center rounded-full border border-accent-lavender/35 text-accent-lavender'>
          <PieChart className='size-5' aria-hidden='true' />
        </span>
      </div>

      <CategorySpendChart
        categories={categories}
        isError={isError}
        isLoading={isLoading}
        total={total}
      />

      {legendCategories.length > 0 && total > 0 ? (
        <div className='mt-5 grid gap-x-6 gap-y-3 sm:grid-cols-2'>
          {legendCategories.map((category, index) => (
            <div
              key={category.id ?? category.category}
              className='grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3'
            >
              <div className='flex min-w-0 items-center gap-2'>
                <span
                  className='size-2.5 shrink-0 rounded-full'
                  style={{ backgroundColor: getCategoryColor(index) }}
                  aria-hidden='true'
                />
                <span className='truncate text-sm font-semibold text-muted-strong'>
                  {category.category}
                </span>
              </div>
              <span className='text-sm font-bold tabular-nums text-ink'>
                {formatPercentage(category.share)}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
