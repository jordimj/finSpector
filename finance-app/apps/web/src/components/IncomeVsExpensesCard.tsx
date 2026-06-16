import { TrendingDown, TrendingUp } from 'lucide-react';
import type { IncomeVsExpenses } from '../types';
import { formatCurrency, formatPercentage } from '../utils';
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
  const netTotal = Number(data?.totals.net ?? incomeTotal - expensesTotal);
  const hasSurplus = netTotal >= 0;
  const savingsRate = incomeTotal > 0 ? netTotal / incomeTotal : undefined;
  const NetIcon = hasSurplus ? TrendingUp : TrendingDown;

  return (
    <div className='flex min-h-[34rem] flex-col rounded-lg border border-line bg-panel p-5 shadow-shell'>
      <div className='mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
        <div>
          <h2 className='text-xl font-semibold tracking-normal text-ink'>
            Income vs expenses
          </h2>
          <span className='mt-1 block text-sm font-medium text-muted'>
            Trend analysis for {periodLabel}
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
              className='size-2 rounded-full bg-accent-lavender'
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

      <div className='mt-4 flex flex-col gap-3 rounded-md bg-panel-raised/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex min-w-0 items-center gap-3'>
          <span
            className={cnNetIconClass(hasSurplus)}
            aria-hidden='true'
          >
            <NetIcon className='size-4' />
          </span>
          <p className='min-w-0 text-sm font-semibold text-muted-strong'>
            {isLoading ? (
              'Calculating net cashflow'
            ) : (
              <>
                {hasSurplus ? 'Surplus' : 'Deficit'} of{' '}
                <span
                  className={
                    hasSurplus ? 'text-accent-green' : 'text-accent-rose'
                  }
                >
                  {formatCurrency(Math.abs(netTotal))}
                </span>
              </>
            )}
          </p>
        </div>

        <p className='text-sm font-semibold tabular-nums text-muted-strong'>
          Savings rate{' '}
          <span className='text-ink'>
            {isLoading || savingsRate === undefined
              ? '--'
              : formatPercentage(savingsRate)}
          </span>
        </p>
      </div>
    </div>
  );
}

function cnNetIconClass(hasSurplus: boolean): string {
  return [
    'flex size-7 shrink-0 items-center justify-center rounded-md',
    hasSurplus
      ? 'bg-accent-green/15 text-accent-green'
      : 'bg-accent-rose/15 text-accent-rose',
  ].join(' ');
}
