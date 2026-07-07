import type { LastMonthExpenseRange } from '../../hooks/useLastMonthExpenses';

type SpendRangeControlProps = {
  activeRange: LastMonthExpenseRange;
  onRangeChange: (range: LastMonthExpenseRange) => void;
};

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

export function SpendRangeControl({
  activeRange,
  onRangeChange,
}: SpendRangeControlProps) {
  return (
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
  );
}
