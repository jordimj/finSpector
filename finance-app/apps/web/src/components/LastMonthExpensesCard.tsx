import type { LastMonthExpenses } from '../hooks/useLastMonthExpenses';
import { formatCurrency, formatDateRange } from '../utils';
import { LastMonthExpenseChart } from './LastMonthExpenseChart';

type LastMonthExpensesCardProps = {
  data?: LastMonthExpenses;
  isError: boolean;
  isLoading: boolean;
};

export function LastMonthExpensesCard({
  data,
  isError,
  isLoading,
}: LastMonthExpensesCardProps) {
  const periodLabel =
    data === undefined
      ? 'Last month'
      : formatDateRange(data.startDate, data.endDate);
  const activeDays =
    data?.dailyExpenses.filter((point) => point.amount > 0).length ?? 0;

  return (
    <div className='flex min-h-[24rem] flex-col rounded-lg border border-line bg-panel p-5 shadow-shell'>
      <div className='mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
        <div>
          <p className='text-xs font-bold uppercase tracking-[0.14em] text-muted-strong'>
            Last month spent
          </p>
          <p className='mt-3 text-4xl font-bold tracking-normal tabular-nums text-ink md:text-5xl'>
            {isLoading || data === undefined
              ? '--'
              : formatCurrency(data.total)}
          </p>
          <p className='mt-3 text-sm font-bold text-accent-green'>
            {isLoading
              ? 'Reading spend trend'
              : `${activeDays} active expense days`}
          </p>
        </div>

        <div className='flex items-center gap-2 text-sm font-semibold text-muted-strong'>
          <span className='rounded-md bg-panel-raised px-3 py-2 text-ink'>
            1M
          </span>
          <span className='px-3 py-2'>6M</span>
          <span className='px-3 py-2'>1Y</span>
        </div>
      </div>

      <p className='mb-3 text-sm font-medium text-muted'>{periodLabel}</p>

      <LastMonthExpenseChart
        data={data?.dailyExpenses ?? []}
        isError={isError}
        isLoading={isLoading}
      />
    </div>
  );
}
