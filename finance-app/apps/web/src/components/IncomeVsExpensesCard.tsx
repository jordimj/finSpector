import type { IncomeVsExpenses } from '../types';
import { formatCurrency } from '../utils';
import { IncomeVsExpensesChart } from './IncomeVsExpensesChart';

type IncomeVsExpensesCardProps = {
  data?: IncomeVsExpenses;
  isError: boolean;
  isLoading: boolean;
  periodLabel: string;
};

export function IncomeVsExpensesCard({
  data,
  isError,
  isLoading,
  periodLabel,
}: IncomeVsExpensesCardProps) {
  const incomeTotal = Number(data?.totals.income ?? 0);
  const expensesTotal = Number(data?.totals.expenses ?? 0);

  return (
    <div className='flex flex-col rounded-lg border border-line bg-panel p-5'>
      <div className='mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
        <div>
          <h2 className='text-sm font-semibold text-ink'>Income vs Expenses</h2>
          <span className='mt-1 block text-xs font-medium text-muted'>
            {periodLabel}
          </span>
        </div>

        <div className='flex flex-wrap gap-x-5 gap-y-2 text-xs'>
          <div className='flex items-center gap-2'>
            <span
              className='size-2 rounded-full bg-accent-green'
              aria-hidden='true'
            />
            <span className='font-medium text-muted'>Income</span>
            <span className='font-semibold tabular-nums text-ink'>
              {isLoading ? '...' : formatCurrency(incomeTotal)}
            </span>
          </div>
          <div className='flex items-center gap-2'>
            <span
              className='size-2 rounded-full bg-accent-rose'
              aria-hidden='true'
            />
            <span className='font-medium text-muted'>Expenses</span>
            <span className='font-semibold tabular-nums text-ink'>
              {isLoading ? '...' : formatCurrency(expensesTotal)}
            </span>
          </div>
        </div>
      </div>

      <IncomeVsExpensesChart
        data={data?.periods ?? []}
        isError={isError}
        isLoading={isLoading}
      />
    </div>
  );
}
