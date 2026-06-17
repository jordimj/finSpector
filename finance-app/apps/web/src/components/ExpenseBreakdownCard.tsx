import { PieChart } from 'lucide-react';
import type { CategorySpendCategory } from '../types';
import { formatCurrency, formatPercentage } from '../utils';
import { getCategoryColor } from './categoryVisuals';
import { CategorySpendChart } from './CategorySpendChart';

type ExpenseBreakdownCardProps = {
  categories: CategorySpendCategory[];
  isError: boolean;
  isLoading: boolean;
  onCategorySelect?: (category: CategorySpendCategory) => void;
  title?: string;
  total: number;
  totalLabel?: string;
};

export function ExpenseBreakdownCard({
  categories,
  isError,
  isLoading,
  onCategorySelect,
  title = 'Category allocation',
  total,
  totalLabel = 'Total spend',
}: ExpenseBreakdownCardProps) {
  const legendCategories = categories.slice(0, 4);

  return (
    <div className='flex min-h-[34rem] flex-col rounded-lg border border-line bg-panel p-5 shadow-shell'>
      <div className='mb-5 flex items-start justify-between gap-3'>
        <div>
          <h2 className='text-xl font-semibold tracking-normal text-ink'>
            {title}
          </h2>
          <p className='mt-1 text-sm font-medium text-muted'>
            {totalLabel}: {isLoading ? 'Loading totals' : formatCurrency(total)}
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
        onCategorySelect={onCategorySelect}
        total={total}
      />

      {legendCategories.length > 0 && total > 0 ? (
        <div className='mt-5 grid gap-x-6 gap-y-3 sm:grid-cols-2'>
          {legendCategories.map((category, index) => {
            const content = (
              <>
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
              </>
            );

            return onCategorySelect ? (
              <button
                key={category.id ?? category.category}
                type='button'
                className='grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-md text-left transition hover:text-accent-lavender focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-lavender'
                onClick={() => onCategorySelect(category)}
              >
                {content}
              </button>
            ) : (
              <div
                key={category.id ?? category.category}
                className='grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3'
              >
                {content}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
