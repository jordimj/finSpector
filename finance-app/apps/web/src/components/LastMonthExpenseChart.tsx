import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { LastMonthExpensePoint } from '../types';
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
      <div className='flex min-h-[280px] flex-1 items-end gap-2 rounded-md border border-line bg-canvas p-4'>
        {Array.from({ length: 12 }, (_, index) => (
          <div
            key={index}
            className='flex min-w-0 flex-1 items-end'
            aria-hidden='true'
          >
            <div
              className='w-full animate-pulse rounded-t-md bg-muted/20'
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
              cursor={{ fill: 'rgb(103 232 249 / 0.08)' }}
              content={<LastMonthExpenseTooltip />}
            />
            <Bar
              dataKey='amount'
              fill='#67e8f9'
              maxBarSize={24}
              radius={[5, 5, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      ) : null}
    </div>
  );
}
