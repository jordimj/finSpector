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
      <div className='flex min-h-[280px] flex-1 items-end gap-3 rounded-md border border-line bg-canvas p-4'>
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
              className='w-full max-w-5 animate-pulse rounded-t-md bg-accent-rose/20'
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
      className='min-h-[280px] flex-1 rounded-md border border-line bg-canvas p-3'
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
            barCategoryGap='26%'
            margin={{ top: 8, right: 24, bottom: 0, left: 6 }}
          >
            <CartesianGrid
              stroke='#28303a'
              strokeDasharray='3 3'
              vertical={false}
            />
            <XAxis
              dataKey='label'
              interval='preserveStartEnd'
              minTickGap={18}
              padding={{ left: 8, right: 8 }}
              tick={{ fill: '#9aa5b4', fontSize: 11 }}
              tickLine={false}
              axisLine={{ stroke: '#28303a' }}
            />
            <YAxis
              width={58}
              tick={{ fill: '#9aa5b4', fontSize: 11 }}
              tickFormatter={(value) => formatCompactCurrency(Number(value))}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              cursor={{ fill: 'rgb(244 247 251 / 0.05)' }}
              content={<IncomeVsExpensesTooltip />}
            />
            <Bar
              dataKey='incomeAmount'
              name='Income'
              fill='#86efac'
              maxBarSize={20}
              radius={[5, 5, 0, 0]}
            />
            <Bar
              dataKey='expensesAmount'
              name='Expenses'
              fill='#fb7185'
              maxBarSize={20}
              radius={[5, 5, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      ) : null}
    </div>
  );
}
