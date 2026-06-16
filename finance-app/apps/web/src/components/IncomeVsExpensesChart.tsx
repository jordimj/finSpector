import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useHasElementSize } from '../hooks/useHasElementSize';
import type { IncomeVsExpensesPeriod } from '../types';
import { formatCompactCurrency } from '../utils';
import { IncomeVsExpensesChartState } from './IncomeVsExpensesChartState';
import { IncomeVsExpensesTooltip } from './IncomeVsExpensesTooltip';

type IncomeVsExpensesChartProps = {
  data: IncomeVsExpensesPeriod[];
  isError: boolean;
  isLoading: boolean;
};

export function IncomeVsExpensesChart({
  data,
  isError,
  isLoading,
}: IncomeVsExpensesChartProps) {
  const hasCashflow = data.some(
    (period) => period.incomeAmount > 0 || period.expensesAmount > 0,
  );
  const [chartContainerRef, hasChartSize, chartSize] =
    useHasElementSize<HTMLDivElement>();

  if (isLoading) {
    return (
      <div className='flex min-h-[330px] flex-1 items-end gap-4 rounded-md border border-line/70 bg-canvas/70 p-5'>
        {Array.from({ length: 8 }, (_, index) => (
          <div
            key={index}
            className='flex min-w-0 flex-1 items-end justify-center gap-1.5'
            aria-hidden='true'
          >
            <div
              className='w-full max-w-5 animate-pulse rounded-t-md bg-accent-green/20'
              style={{ height: `${30 + ((index * 19) % 50)}%` }}
            />
            <div
              className='w-full max-w-6 animate-pulse rounded-t-md bg-accent-lavender/20'
              style={{ height: `${24 + ((index * 23) % 56)}%` }}
            />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <IncomeVsExpensesChartState>
        <p className='text-sm font-medium text-ink'>
          Unable to load income and expenses
        </p>
        <p className='mt-1 text-xs text-muted'>
          Check that the API is running and try again.
        </p>
      </IncomeVsExpensesChartState>
    );
  }

  if (!hasCashflow) {
    return (
      <IncomeVsExpensesChartState>
        <p className='text-sm font-medium text-ink'>No cashflow recorded</p>
        <p className='mt-1 text-xs text-muted'>
          Imported income and expenses will show up here.
        </p>
      </IncomeVsExpensesChartState>
    );
  }

  return (
    <div
      ref={chartContainerRef}
      className='min-h-[330px] flex-1 rounded-md border border-line/70 bg-canvas/70 p-3'
    >
      {hasChartSize && chartSize !== null ? (
        <ResponsiveContainer
          width='100%'
          height='100%'
          minWidth={0}
          minHeight={0}
          initialDimension={chartSize}
        >
          <BarChart
            data={data}
            barCategoryGap='30%'
            barGap={8}
            margin={{ top: 18, right: 18, bottom: 2, left: 0 }}
          >
            <CartesianGrid
              stroke='#27334d'
              strokeDasharray='4 6'
              vertical={false}
            />
            <XAxis
              dataKey='label'
              interval='preserveStartEnd'
              minTickGap={18}
              padding={{ left: 8, right: 8 }}
              tick={{ fill: '#c9d1ea', fontSize: 12, fontWeight: 600 }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              width={54}
              tick={{ fill: '#98a2b8', fontSize: 11 }}
              tickFormatter={(value) => formatCompactCurrency(Number(value))}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ fill: 'rgb(184 190 253 / 0.08)' }}
              content={<IncomeVsExpensesTooltip />}
            />
            <Bar
              dataKey='incomeAmount'
              name='Income'
              fill='#4ade80'
              maxBarSize={24}
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey='expensesAmount'
              name='Expenses'
              fill='#b8befd'
              maxBarSize={24}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      ) : null}
    </div>
  );
}
