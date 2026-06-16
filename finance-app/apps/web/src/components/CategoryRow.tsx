import type { CategorySpendCategory } from '../types';
import { formatCurrency } from '../utils';

type CategoryRowProps = {
  category: CategorySpendCategory;
  color: string;
};

export function CategoryRow({ category, color }: CategoryRowProps) {
  const width =
    category.share > 0 ? `${Math.max(category.share * 100, 3)}%` : '0%';

  return (
    <div className='grid grid-cols-[minmax(0,1fr)_104px_60px] items-center gap-3 px-5 py-4'>
      <div className='min-w-0'>
        <div className='flex items-center gap-2'>
          <span
            className='size-2.5 shrink-0 rounded-full'
            style={{ backgroundColor: color }}
            aria-hidden='true'
          />
          <p className='truncate text-sm font-medium text-ink'>
            {category.category}
          </p>
        </div>
        <div className='mt-2 h-1.5 rounded-full bg-canvas'>
          <div
            className='h-full rounded-full'
            style={{ width, backgroundColor: color }}
          />
        </div>
      </div>
      <span className='text-right text-sm font-medium tabular-nums text-muted-strong'>
        {formatCurrency(category.totalAmount)}
      </span>
      <span className='text-right text-xs tabular-nums text-muted'>
        {category.transactionCount} tx
      </span>
    </div>
  );
}
