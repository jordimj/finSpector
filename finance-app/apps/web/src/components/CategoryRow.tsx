import type { CategorySpendCategory } from '../types';
import { formatCurrency, formatPercentage } from '../utils';
import { getCategoryIcon } from './categoryVisuals';

type CategoryRowProps = {
  category: CategorySpendCategory;
  color: string;
};

export function CategoryRow({ category, color }: CategoryRowProps) {
  const width =
    category.share > 0 ? `${Math.max(category.share * 100, 3)}%` : '0%';
  const Icon = getCategoryIcon(category.category);
  const status =
    category.share >= 0.25
      ? 'Major driver'
      : category.share >= 0.12
        ? 'Steady spend'
        : 'Low impact';

  return (
    <div className='grid gap-4 px-5 py-5 transition hover:bg-panel-raised/30 md:grid-cols-[minmax(0,1.15fr)_minmax(7rem,0.55fr)_minmax(12rem,0.95fr)] md:items-center'>
      <div className='flex min-w-0 items-center gap-3'>
        <span
          className='flex size-11 shrink-0 items-center justify-center rounded-md border border-line'
          style={{
            backgroundColor: `${color}1f`,
            color,
          }}
          aria-hidden='true'
        >
          <Icon className='size-5' />
        </span>

        <div className='min-w-0'>
          <p className='truncate text-base font-semibold text-ink'>
            {category.category}
          </p>
          <p className='mt-1 text-sm font-medium text-muted'>
            {category.transactionCount} transactions
          </p>
        </div>
      </div>

      <span className='text-left text-base font-semibold tabular-nums text-ink md:text-right'>
        {formatCurrency(category.totalAmount)}
      </span>

      <div className='min-w-0'>
        <div className='mb-2 flex items-center justify-between gap-3'>
          <span className='text-xs font-bold uppercase tracking-[0.12em] text-muted-strong'>
            {status}
          </span>
          <span className='text-xs font-semibold tabular-nums text-muted'>
            {formatPercentage(category.share)}
          </span>
        </div>
        <div className='h-2 rounded-full bg-canvas'>
          <span
            className='block h-full rounded-full'
            style={{
              width,
              backgroundColor: color,
              boxShadow: `0 0 18px ${color}40`,
            }}
            aria-hidden='true'
          />
        </div>
      </div>
    </div>
  );
}
