import { formatCurrency, formatSignedCurrency } from '../utils';
import type { IncomeVsExpensesChartPeriod } from './IncomeVsExpensesChart';

type IncomeVsExpensesTooltipProps = {
  active?: boolean;
  expenseLabel?: string;
  payload?: Array<{
    payload?: IncomeVsExpensesChartPeriod;
  }>;
  showExpenses?: boolean;
};

export function IncomeVsExpensesTooltip({
  active,
  expenseLabel = 'Expenses',
  payload,
  showExpenses = true,
}: IncomeVsExpensesTooltipProps) {
  const period = payload?.[0]?.payload;

  if (!active || period === undefined) {
    return null;
  }

  const hasIncomeComparison =
    period.comparisonPeriodLabel !== undefined &&
    period.comparisonIncomeAmount !== undefined;
  const hasFullComparison =
    hasIncomeComparison &&
    period.comparisonExpensesAmount !== undefined &&
    period.comparisonNetAmount !== undefined;
  const hasComparison = showExpenses ? hasFullComparison : hasIncomeComparison;

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
        {showExpenses ? (
          <>
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
          </>
        ) : null}
      </div>
      {hasComparison ? (
        <div className='mt-2 border-t border-line pt-2 text-xs'>
          <p className='font-semibold text-muted'>
            Compared with {period.comparisonPeriodLabel}
          </p>
          <div className='mt-2 grid gap-1'>
            <ComparisonRow
              current={period.incomeAmount}
              label='Income'
              previous={period.comparisonIncomeAmount ?? 0}
            />
            {showExpenses ? (
              <>
                <ComparisonRow
                  current={period.expensesAmount}
                  label={expenseLabel}
                  previous={period.comparisonExpensesAmount ?? 0}
                />
                <ComparisonRow
                  current={period.netAmount}
                  label='Net'
                  previous={period.comparisonNetAmount ?? 0}
                />
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function ComparisonRow({
  current,
  label,
  previous,
}: {
  current: number;
  label: string;
  previous: number;
}) {
  return (
    <div className='flex items-center justify-between gap-6'>
      <span className='text-muted'>{label}</span>
      <span className='font-semibold tabular-nums text-muted-strong'>
        {formatCurrency(previous)}
        <span className='ml-2 text-ink'>
          {formatSignedCurrency(current - previous)}
        </span>
      </span>
    </div>
  );
}
