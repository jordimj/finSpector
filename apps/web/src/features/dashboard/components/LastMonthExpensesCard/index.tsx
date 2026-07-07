import type { CSSProperties } from 'react';
import type {
  LastMonthExpenseRange,
  LastMonthExpenses,
} from '../../hooks/useLastMonthExpenses';
import { formatCurrency } from '../../../../utils';
import { LastMonthExpenseChart } from '../LastMonthExpenseChart';
import { SpendRangeControl } from './SpendRangeControl';

type LastMonthExpensesCardProps = {
  activeRange: LastMonthExpenseRange;
  className?: string;
  data?: LastMonthExpenses;
  isError: boolean;
  isLoading: boolean;
  onRangeChange: (range: LastMonthExpenseRange) => void;
  style?: CSSProperties;
};

const rangeTitles = {
  '1m': 'Last month spent',
  '6m': 'Last 6 months spent',
  '1y': 'Last 12 months spent',
} satisfies Record<LastMonthExpenseRange, string>;

export function LastMonthExpensesCard({
  activeRange,
  className,
  data,
  isError,
  isLoading,
  onRangeChange,
  style,
}: LastMonthExpensesCardProps) {
  const title = rangeTitles[activeRange];

  return (
    <div
      className={[
        'flex min-h-[24rem] flex-col rounded-lg border border-line bg-panel p-5 shadow-shell',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={style}
    >
      <div className='mb-4 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between'>
        <div>
          <p className='text-xs font-bold uppercase tracking-[0.14em] text-muted-strong'>
            {title}
          </p>
          <p className='mt-3 text-4xl font-bold tracking-normal tabular-nums text-ink md:text-5xl'>
            {isLoading || data === undefined
              ? '--'
              : formatCurrency(data.total)}
          </p>
        </div>

        <SpendRangeControl
          activeRange={activeRange}
          onRangeChange={onRangeChange}
        />
      </div>

      <LastMonthExpenseChart
        data={data?.dailyExpenses ?? []}
        isError={isError}
        isLoading={isLoading}
      />
    </div>
  );
}
