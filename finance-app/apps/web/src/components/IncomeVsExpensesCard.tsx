import { TrendingDown, TrendingUp } from 'lucide-react';
import type { IncomeVsExpenses } from '../types';
import { formatCurrency, formatPercentage } from '../utils';
import { IncomeVsExpensesChart } from './IncomeVsExpensesChart';

type IncomeVsExpensesCardProps = {
  data?: IncomeVsExpenses;
  expenseLabel?: string;
  isError: boolean;
  isLoading: boolean;
  periodLabel: string;
  scopedExpenseComparison?: boolean;
};

export function IncomeVsExpensesCard({
  data,
  expenseLabel = 'Expenses',
  isError,
  isLoading,
  periodLabel,
  scopedExpenseComparison = false,
}: IncomeVsExpensesCardProps) {
  const incomeTotal = Number(data?.totals.income ?? 0);
  const expensesTotal = Number(data?.totals.expenses ?? 0);
  const netTotal = Number(data?.totals.net ?? incomeTotal - expensesTotal);
  const hasSurplus = netTotal >= 0;
  const savingsRate = incomeTotal > 0 ? netTotal / incomeTotal : undefined;
  const expenseIncomeShare =
    incomeTotal > 0 ? expensesTotal / incomeTotal : undefined;
  const NetIcon = hasSurplus ? TrendingUp : TrendingDown;
  const title = scopedExpenseComparison
    ? `Income vs ${expenseLabel}`
    : 'Income vs expenses';
  const subtitle = scopedExpenseComparison
    ? `${expenseLabel} spend for ${periodLabel}`
    : `Trend analysis for ${periodLabel}`;
  const summaryMetricLabel = scopedExpenseComparison
    ? 'Income share'
    : 'Savings rate';
  const summaryMetricValue = scopedExpenseComparison
    ? expenseIncomeShare
    : savingsRate;

  return (
    <div className='flex min-h-[34rem] flex-col rounded-lg border border-line bg-panel p-5 shadow-shell'>
      <div className='mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
        <div>
          <h2 className='text-xl font-semibold tracking-normal text-ink'>
            {title}
          </h2>
          <span className='mt-1 block text-sm font-medium text-muted'>
            {subtitle}
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
            <span className='font-medium text-muted'>{expenseLabel}</span>
            <span className='font-semibold tabular-nums text-ink'>
              {isLoading ? '...' : formatCurrency(expensesTotal)}
            </span>
          </div>
        </div>
      </div>

      <IncomeVsExpensesChart
        data={data?.periods ?? []}
        expenseLabel={expenseLabel}
        isError={isError}
        isLoading={isLoading}
      />

      <div className='mt-4 flex flex-col gap-3 rounded-md bg-panel-raised/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between'>
        <div className='flex min-w-0 items-center gap-3'>
          <span className={cnNetIconClass(hasSurplus)} aria-hidden='true'>
            <NetIcon className='size-4' />
          </span>
          <p className='min-w-0 text-sm font-semibold text-muted-strong'>
            {isLoading ? (
              scopedExpenseComparison ? (
                'Calculating comparison'
              ) : (
                'Calculating net cashflow'
              )
            ) : scopedExpenseComparison ? (
              <>
                {hasSurplus ? 'Remaining after spend' : 'Over income by'}{' '}
                <span
                  className={
                    hasSurplus ? 'text-accent-green' : 'text-accent-rose'
                  }
                >
                  {formatCurrency(Math.abs(netTotal))}
                </span>
              </>
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
          {summaryMetricLabel}{' '}
          <span className='text-ink'>
            {isLoading || summaryMetricValue === undefined
              ? '--'
              : formatPercentage(summaryMetricValue)}
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
