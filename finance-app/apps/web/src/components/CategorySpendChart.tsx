import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { useHasElementSize } from '../hooks/useHasElementSize';
import type { CategorySpendCategory } from '../types';
import { formatCurrency } from '../utils';
import { CategorySpendChartState } from './CategorySpendChartState';
import { CategorySpendTooltip } from './CategorySpendTooltip';

const categoryColors = [
  '#67e8f9',
  '#86efac',
  '#fbbf24',
  '#fb7185',
  '#a78bfa',
  '#60a5fa',
];

function getCategoryColor(index: number): string {
  return categoryColors[index % categoryColors.length] ?? '#67e8f9';
}

type CategorySpendChartProps = {
  categories: CategorySpendCategory[];
  isError: boolean;
  isLoading: boolean;
  total: number;
};

export function CategorySpendChart({
  categories,
  isError,
  isLoading,
  total,
}: CategorySpendChartProps) {
  const [chartContainerRef, hasChartSize, chartSize] =
    useHasElementSize<HTMLDivElement>();
  const hasSpend = categories.length > 0 && total > 0;

  if (isLoading) {
    return (
      <div className='flex aspect-square min-h-[280px] flex-1 items-center justify-center rounded-md border border-line bg-canvas'>
        <div
          className='size-48 animate-pulse rounded-full border-[34px] border-muted/15 border-r-muted/30 border-t-muted/25'
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
      className='relative aspect-square min-h-[280px] flex-1 rounded-md border border-line bg-canvas p-3'
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
              innerRadius='58%'
              outerRadius='82%'
              paddingAngle={2}
              stroke='#090b0e'
              strokeWidth={3}
            >
              {categories.map((category, index) => (
                <Cell
                  key={category.id ?? category.category}
                  fill={getCategoryColor(index)}
                />
              ))}
            </Pie>
            <Tooltip content={<CategorySpendTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      ) : null}

      <div className='pointer-events-none absolute inset-0 flex items-center justify-center px-10 text-center'>
        <div>
          <p className='text-xs font-medium text-muted'>Total</p>
          <p className='mt-1 text-xl font-semibold tabular-nums text-ink'>
            {formatCurrency(total)}
          </p>
        </div>
      </div>
    </div>
  );
}
