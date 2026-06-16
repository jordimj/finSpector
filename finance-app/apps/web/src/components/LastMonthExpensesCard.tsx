import { LastMonthExpenses } from '../types';
import { formatDateRange } from '../utils';
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
  return (
    <div className='flex flex-col rounded-lg border border-line bg-panel p-5'>
      <div className='mb-5 flex items-center justify-between'>
        <h2 className='text-sm font-semibold text-ink'>Last month expenses</h2>
        <span className='text-xs font-medium text-muted'>
          {data === undefined
            ? 'EUR'
            : formatDateRange(data.startDate, data.endDate)}
        </span>
      </div>

      <LastMonthExpenseChart
        data={data?.dailyExpenses ?? []}
        isError={isError}
        isLoading={isLoading}
      />
    </div>
  );
}
