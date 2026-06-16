import type { LastMonthExpensePoint } from '../types';
import { formatCurrency } from '../utils';

type LastMonthExpenseTooltipProps = {
  active?: boolean;
  payload?: Array<{
    value?: number;
    payload?: LastMonthExpensePoint;
  }>;
};

export function LastMonthExpenseTooltip({
  active,
  payload,
}: LastMonthExpenseTooltipProps) {
  const point = payload?.[0]?.payload;

  if (!active || point === undefined) {
    return null;
  }

  return (
    <div className='rounded-md border border-line bg-panel px-3 py-2 shadow-shell'>
      <p className='text-xs font-medium text-muted'>{point.label}</p>
      <p className='mt-1 text-sm font-semibold text-ink'>
        {formatCurrency(point.amount)}
      </p>
    </div>
  );
}
