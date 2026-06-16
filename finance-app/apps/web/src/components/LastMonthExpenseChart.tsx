import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type {
  ChildrenProps,
  LastMonthExpenseChartProps,
  LastMonthExpensePoint,
} from '../types';
import {
  formatCompactCurrency,
  formatCurrency,
  useHasElementSize,
} from '../utils';

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
      <div className="flex min-h-[280px] flex-1 items-end gap-2 rounded-md border border-line bg-canvas p-4">
        {Array.from({ length: 12 }, (_, index) => (
          <div
            key={index}
            className="flex min-w-0 flex-1 items-end"
            aria-hidden="true"
          >
            <div
              className="w-full animate-pulse rounded-t-md bg-muted/20"
              style={{ height: `${28 + ((index * 17) % 55)}%` }}
            />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <ChartState>
        <p className="text-sm font-medium text-ink">Unable to load expenses</p>
        <p className="mt-1 text-xs text-muted">
          Check that the API is running and try again.
        </p>
      </ChartState>
    );
  }

  if (!hasExpenses) {
    return (
      <ChartState>
        <p className="text-sm font-medium text-ink">No expenses recorded</p>
        <p className="mt-1 text-xs text-muted">
          Last month has no expense transactions yet.
        </p>
      </ChartState>
    );
  }

  return (
    <div
      ref={chartContainerRef}
      className="min-h-[280px] flex-1 rounded-md border border-line bg-canvas p-3"
    >
      {hasChartSize && chartSize !== null ? (
        <ResponsiveContainer
          width="100%"
          height="100%"
          minWidth={0}
          minHeight={0}
          initialDimension={chartSize}
        >
          <BarChart
            data={data}
            margin={{ top: 8, right: 24, bottom: 0, left: 6 }}
          >
            <CartesianGrid
              stroke="#28303a"
              strokeDasharray="3 3"
              vertical={false}
            />
            <XAxis
              dataKey="label"
              interval="preserveStartEnd"
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
              content={<ExpenseTooltip />}
            />
            <Bar
              dataKey="amount"
              fill="#67e8f9"
              maxBarSize={24}
              radius={[5, 5, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      ) : null}
    </div>
  );
}

type ExpenseTooltipProps = {
  active?: boolean;
  payload?: Array<{
    value?: number;
    payload?: LastMonthExpensePoint;
  }>;
};

function ExpenseTooltip({ active, payload }: ExpenseTooltipProps) {
  const point = payload?.[0]?.payload;

  if (!active || point === undefined) {
    return null;
  }

  return (
    <div className="rounded-md border border-line bg-panel px-3 py-2 shadow-shell">
      <p className="text-xs font-medium text-muted">{point.label}</p>
      <p className="mt-1 text-sm font-semibold text-ink">
        {formatCurrency(point.amount)}
      </p>
    </div>
  );
}

function ChartState({ children }: ChildrenProps) {
  return (
    <div className="flex min-h-[280px] flex-1 items-center justify-center rounded-md border border-line bg-canvas px-4 text-center">
      <div>{children}</div>
    </div>
  );
}
