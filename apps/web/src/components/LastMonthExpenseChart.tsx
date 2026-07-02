import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { LastMonthExpensePoint } from '../hooks/useLastMonthExpenses';
import { formatCompactCurrency } from '../utils';
import { useHasElementSize } from '../hooks/useHasElementSize';
import { LastMonthExpenseChartState } from './LastMonthExpenseChartState';
import { LastMonthExpenseTooltip } from './LastMonthExpenseTooltip';

type LastMonthExpenseChartProps = {
  data: LastMonthExpensePoint[];
  isError: boolean;
  isLoading: boolean;
};

export function LastMonthExpenseChart({
  data,
  isError,
  isLoading,
}: LastMonthExpenseChartProps) {
  const hasExpenses = data.some((point) => point.amount > 0);
  const [chartContainerRef, hasChartSize, chartSize] =
    useHasElementSize<HTMLDivElement>();

  if (isLoading) {
    return (
      <div className='flex min-h-[250px] flex-1 items-end gap-2 rounded-md bg-canvas/45 p-4'>
        {Array.from({ length: 12 }, (_, index) => (
          <div
            key={index}
            className='flex min-w-0 flex-1 items-end'
            aria-hidden='true'
          >
            <div
              className='w-full animate-pulse rounded-t-md bg-accent-lavender/20'
              style={{ height: `${28 + ((index * 17) % 55)}%` }}
            />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <LastMonthExpenseChartState>
        <p className='text-sm font-medium text-ink'>Unable to load expenses</p>
        <p className='mt-1 text-xs text-muted'>
          Check that the API is running and try again.
        </p>
      </LastMonthExpenseChartState>
    );
  }

  if (!hasExpenses) {
    return (
      <LastMonthExpenseChartState>
        <p className='text-sm font-medium text-ink'>No expenses recorded</p>
        <p className='mt-1 text-xs text-muted'>
          Last month has no expense transactions yet.
        </p>
      </LastMonthExpenseChartState>
    );
  }

  return (
    <div
      ref={chartContainerRef}
      className='min-h-[250px] flex-1 rounded-md bg-canvas/45 p-3'
    >
      {hasChartSize && chartSize !== null ? (
        <ResponsiveContainer
          width='100%'
          height='100%'
          minWidth={0}
          minHeight={0}
          initialDimension={chartSize}
        >
          <AreaChart
            data={data}
            margin={{ top: 14, right: 16, bottom: 2, left: 10 }}
          >
            <defs>
              <linearGradient
                id='lastMonthSpendGradient'
                x1='0'
                x2='0'
                y1='0'
                y2='1'
              >
                <stop offset='0%' stopColor='#b8befd' stopOpacity={0.42} />
                <stop offset='55%' stopColor='#b8befd' stopOpacity={0.16} />
                <stop offset='100%' stopColor='#b8befd' stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              stroke='#27334d'
              strokeDasharray='4 8'
              vertical={false}
            />
            <XAxis
              dataKey='label'
              interval='preserveStartEnd'
              minTickGap={18}
              padding={{ left: 8, right: 8 }}
              tick={{ fill: '#98a2b8', fontSize: 11 }}
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
              cursor={{ stroke: '#b8befd', strokeWidth: 1 }}
              content={<LastMonthExpenseTooltip />}
            />
            <Area
              activeDot={{
                fill: '#b8befd',
                r: 5,
                stroke: '#080d1b',
                strokeWidth: 2,
              }}
              dataKey='amount'
              fill='url(#lastMonthSpendGradient)'
              fillOpacity={1}
              stroke='#b8befd'
              strokeWidth={3}
              type='monotone'
            />
          </AreaChart>
        </ResponsiveContainer>
      ) : null}
    </div>
  );
}
