import type { IncomeVsExpensesPeriod } from '../types';
import { formatCurrency } from '../utils';

type IncomeVsExpensesTooltipProps = {
  active?: boolean;
  expenseLabel?: string;
  payload?: Array<{
    payload?: IncomeVsExpensesPeriod;
  }>;
};

export function IncomeVsExpensesTooltip({
  active,
  expenseLabel = 'Expenses',
  payload,
}: IncomeVsExpensesTooltipProps) {
  const period = payload?.[0]?.payload;

  if (!active || period === undefined) {
    return null;
  }

  return (
    <div className='rounded-md border border-line bg-panel-raised px-3 py-2 shadow-shell'>
      <p className='text-xs font-semibold text-muted-strong'>{period.label}</p>
      <div className='mt-2 grid gap-1 text-xs'>
        <div className='flex items-center justify-between gap-6'>
          <span className='text-accent-green'>Income</span>
          <span className='font-semibold tabular-nums text-ink'>
            {formatCurrency(period.incomeAmount)}
          </span>
        </div>
        <div className='flex items-center justify-between gap-6'>
          <span className='text-accent-lavender'>{expenseLabel}</span>
          <span className='font-semibold tabular-nums text-ink'>
            {formatCurrency(period.expensesAmount)}
          </span>
        </div>
        <div className='mt-1 flex items-center justify-between gap-6 border-t border-line pt-1'>
          <span className='text-muted'>Net</span>
          <span className='font-semibold tabular-nums text-ink'>
            {formatCurrency(period.netAmount)}
          </span>
        </div>
      </div>
    </div>
  );
}
