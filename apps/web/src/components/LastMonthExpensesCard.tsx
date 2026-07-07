import type { CSSProperties } from 'react';
import type {
  LastMonthExpenseRange,
  LastMonthExpenses,
} from '../hooks/useLastMonthExpenses';
import { formatCurrency } from '../utils';
import { LastMonthExpenseChart } from './LastMonthExpenseChart';

type LastMonthExpensesCardProps = {
  activeRange: LastMonthExpenseRange;
  className?: string;
  data?: LastMonthExpenses;
  isError: boolean;
  isLoading: boolean;
  onRangeChange: (range: LastMonthExpenseRange) => void;
  style?: CSSProperties;
};

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

        <div
          className='flex items-center gap-2 text-sm font-semibold text-muted-strong'
          aria-label='Spend chart period'
        >
          {rangeOptions.map((option) => {
            const isActive = option.value === activeRange;

            return (
              <button
                key={option.value}
                type='button'
                aria-pressed={isActive}
                className={[
                  'h-9 rounded-md px-3 transition active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-lavender',
                  isActive
                    ? 'bg-panel-raised text-ink'
                    : 'text-muted-strong hover:bg-panel-raised/60 hover:text-ink',
                ].join(' ')}
                onClick={() => onRangeChange(option.value)}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <LastMonthExpenseChart
        data={data?.dailyExpenses ?? []}
        isError={isError}
        isLoading={isLoading}
      />
    </div>
  );
}

const rangeOptions = [
  {
    label: '1M',
    value: '1m',
  },
  {
    label: '6M',
    value: '6m',
  },
  {
    label: '1Y',
    value: '1y',
  },
] satisfies Array<{
  label: string;
  value: LastMonthExpenseRange;
}>;

const rangeTitles = {
  '1m': 'Last month spent',
  '6m': 'Last 6 months spent',
  '1y': 'Last 12 months spent',
} satisfies Record<LastMonthExpenseRange, string>;
