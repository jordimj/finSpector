import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useHasElementSize } from '../hooks/useHasElementSize';
import type { CategorySpend } from '../hooks/useCategorySpend';
import { formatCompactCurrency } from '../utils';
import { getCategoryColor } from './categoryVisuals';
import { CategorySpendChartState } from './CategorySpendChartState';
import { CategorySpendTooltip } from './CategorySpendTooltip';

type CategorySpendChartProps = {
  categories: CategorySpend[];
  isError: boolean;
  isLoading: boolean;
  onCategorySelect?: (category: CategorySpend) => void;
  total: number;
};

export function CategorySpendChart({
  categories,
  isError,
  isLoading,
  onCategorySelect,
  total,
}: CategorySpendChartProps) {
  const [chartContainerRef, hasChartSize, chartSize] =
    useHasElementSize<HTMLDivElement>();
  const hasSpend = categories.length > 0 && total > 0;

  if (isLoading) {
    return (
      <div className='flex aspect-square min-h-[300px] flex-1 items-center justify-center rounded-md border border-line/70 bg-canvas/70'>
        <div
          className='size-52 animate-pulse rounded-full border-[36px] border-accent-lavender/20 border-b-accent-green/40 border-r-accent-lavender/35'
          aria-hidden='true'
        />
      </div>
    );
  }

  if (isError) {
    return (
      <CategorySpendChartState>
        <p className='text-sm font-medium text-ink'>
          Unable to load category spend
        </p>
        <p className='mt-1 text-xs text-muted'>
          Check that the API is running and try again.
        </p>
      </CategorySpendChartState>
    );
  }

  if (!hasSpend) {
    return (
      <CategorySpendChartState>
        <p className='text-sm font-medium text-ink'>No category spend yet</p>
        <p className='mt-1 text-xs text-muted'>
          This month has no expense transactions yet.
        </p>
      </CategorySpendChartState>
    );
  }

  return (
    <div
      ref={chartContainerRef}
      className='relative aspect-square min-h-[300px] flex-1 rounded-md border border-line/70 bg-canvas/70 p-3'
    >
      {hasChartSize && chartSize !== null ? (
        <ResponsiveContainer
          width='100%'
          height='100%'
          minWidth={0}
          minHeight={0}
          initialDimension={chartSize}
        >
          <PieChart>
            <Pie
              data={categories}
              dataKey='totalAmount'
              nameKey='category'
              cx='50%'
              cy='50%'
              innerRadius='60%'
              outerRadius='83%'
              paddingAngle={1}
              stroke='#080d1b'
              strokeWidth={2}
            >
              {categories.map((category, index) => (
                <Cell
                  key={category.id ?? category.category}
                  className={onCategorySelect ? 'cursor-pointer' : undefined}
                  fill={getCategoryColor(index)}
                  onClick={
                    onCategorySelect
                      ? () => onCategorySelect(category)
                      : undefined
                  }
                />
              ))}
            </Pie>
            <Tooltip content={<CategorySpendTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      ) : null}

      <div className='pointer-events-none absolute inset-0 flex items-center justify-center px-10 text-center'>
        <div>
          <p className='text-4xl font-bold tracking-normal tabular-nums text-ink md:text-5xl'>
            {formatCompactCurrency(total)}
          </p>
          <p className='mt-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-strong'>
            Spent
          </p>
        </div>
      </div>
    </div>
  );
}
