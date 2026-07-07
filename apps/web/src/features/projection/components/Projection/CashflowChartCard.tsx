import { IncomeVsExpensesChart } from '../../../../components/IncomeVsExpensesChart';
import type { Projection } from '../../hooks/useProjection';

type CashflowChartCardProps = {
  data: Projection['chartData'] | undefined;
  isError: boolean;
  isLoading: boolean;
};

export function CashflowChartCard({
  data,
  isError,
  isLoading,
}: CashflowChartCardProps) {
  return (
    <div className='flex min-h-[34rem] flex-col rounded-lg border border-line bg-panel p-5 shadow-shell'>
      <div className='mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
        <div>
          <h2 className='text-xl font-semibold tracking-normal text-ink'>
            Projected monthly cashflow
          </h2>
          <span className='mt-1 block text-sm font-medium text-muted'>
            Same-month expenses from last year with editable assumptions
          </span>
        </div>
        <div className='flex flex-wrap gap-x-5 gap-y-2 text-xs'>
          <div className='flex items-center gap-2'>
            <span
              className='size-2 rounded-full bg-accent-green'
              aria-hidden='true'
            />
            <span className='font-medium text-muted'>Income</span>
          </div>
          <div className='flex items-center gap-2'>
            <span
              className='size-2 rounded-full bg-accent-lavender'
              aria-hidden='true'
            />
            <span className='font-medium text-muted'>Expenses</span>
          </div>
        </div>
      </div>

      <IncomeVsExpensesChart
        data={data}
        expenseLabel='Expenses'
        isError={isError}
        isLoading={isLoading}
      />
    </div>
  );
}
