import type { CategorySpendCategory } from '../types';
import { formatCurrency, formatPercentage } from '../utils';

type CategorySpendTooltipProps = {
  active?: boolean;
  payload?: Array<{
    payload?: CategorySpendCategory;
  }>;
};

export function CategorySpendTooltip({
  active,
  payload,
}: CategorySpendTooltipProps) {
  const category = payload?.[0]?.payload;

  if (!active || category === undefined) {
    return null;
  }

  return (
    <div className='rounded-md border border-line bg-panel-raised px-3 py-2 shadow-shell'>
      <p className='text-xs font-semibold text-muted-strong'>
        {category.category}
      </p>
      <p className='mt-1 text-sm font-semibold text-ink'>
        {formatCurrency(category.totalAmount)}
      </p>
      <p className='mt-1 text-xs text-muted'>
        {formatPercentage(category.share)} of spend
      </p>
    </div>
  );
}
