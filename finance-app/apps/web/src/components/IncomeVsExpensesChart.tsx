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
import type {
  IncomeVsExpenses,
  IncomeVsExpensesPeriod,
} from '../hooks/useIncomeVsExpenses';
import { formatCompactCurrency, formatDateKey, parseDateKey } from '../utils';
import { IncomeVsExpensesChartState } from './IncomeVsExpensesChartState';
import { IncomeVsExpensesTooltip } from './IncomeVsExpensesTooltip';

type IncomeVsExpensesChartProps = {
  comparisonData?: IncomeVsExpenses;
  data?: IncomeVsExpenses;
  expenseLabel?: string;
  isError: boolean;
  isLoading: boolean;
};

export type IncomeVsExpensesChartPeriod = IncomeVsExpensesPeriod & {
  comparisonExpensesAmount?: number;
  comparisonIncomeAmount?: number;
  comparisonNetAmount?: number;
  comparisonPeriodLabel?: string;
};

export function IncomeVsExpensesChart({
  comparisonData,
  data,
  expenseLabel = 'Expenses',
  isError,
  isLoading,
}: IncomeVsExpensesChartProps) {
  const chartData = buildChartData(data, comparisonData);
  const hasCashflow = chartData.some(
    (period) =>
      period.incomeAmount > 0 ||
      period.expensesAmount > 0 ||
      (period.comparisonIncomeAmount ?? 0) > 0 ||
      (period.comparisonExpensesAmount ?? 0) > 0,
  );
  const hasComparison = chartData.some(
    (period) =>
      period.comparisonIncomeAmount !== undefined ||
      period.comparisonExpensesAmount !== undefined,
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
            key={hasComparison ? 'with-comparison' : 'without-comparison'}
            data={chartData}
            barCategoryGap={hasComparison ? '18%' : '30%'}
            barGap={hasComparison ? 3 : 8}
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
              content={<IncomeVsExpensesTooltip expenseLabel={expenseLabel} />}
            />
            {hasComparison ? (
              <Bar
                dataKey='comparisonIncomeAmount'
                name='Previous income'
                fill='#4ade80'
                fillOpacity={0.24}
                maxBarSize={14}
                radius={[4, 4, 0, 0]}
              />
            ) : null}
            <Bar
              dataKey='incomeAmount'
              name='Income'
              fill='#4ade80'
              maxBarSize={hasComparison ? 18 : 24}
              radius={[4, 4, 0, 0]}
            />
            {hasComparison ? (
              <Bar
                dataKey='comparisonExpensesAmount'
                name={`Previous ${expenseLabel.toLocaleLowerCase()}`}
                fill='#b8befd'
                fillOpacity={0.26}
                maxBarSize={14}
                radius={[4, 4, 0, 0]}
              />
            ) : null}
            <Bar
              dataKey='expensesAmount'
              name={expenseLabel}
              fill='#b8befd'
              maxBarSize={hasComparison ? 18 : 24}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      ) : null}
    </div>
  );
}

function buildChartData(
  data: IncomeVsExpenses | undefined,
  comparisonData: IncomeVsExpenses | undefined,
): IncomeVsExpensesChartPeriod[] {
  const periods = toCompletePeriods(data);
  const comparisonPeriods = toCompletePeriods(comparisonData);

  return periods.map((period, index) => {
    const comparisonPeriod = comparisonPeriods[index];

    if (comparisonPeriod === undefined) {
      return period;
    }

    return {
      ...period,
      comparisonExpensesAmount: comparisonPeriod.expensesAmount,
      comparisonIncomeAmount: comparisonPeriod.incomeAmount,
      comparisonNetAmount: comparisonPeriod.netAmount,
      comparisonPeriodLabel: comparisonPeriod.label,
    };
  });
}

function toCompletePeriods(
  report: IncomeVsExpenses | undefined,
): IncomeVsExpensesPeriod[] {
  if (report === undefined) {
    return [];
  }

  if (
    report.groupBy !== 'month' ||
    report.startDate === undefined ||
    report.endDate === undefined
  ) {
    return report.periods;
  }

  const periodsByKey = new Map(
    report.periods.map((period) => [period.period, period]),
  );

  return getMonthPeriodKeys(report.startDate, report.endDate).map(
    (periodKey) =>
      periodsByKey.get(periodKey) ?? buildEmptyPeriod(periodKey, report.groupBy),
  );
}

function getMonthPeriodKeys(startDate: string, endDate: string): string[] {
  const start = parseDateKey(startDate);
  const end = parseDateKey(endDate);
  const periodKeys: string[] = [];
  let year = start.getFullYear();
  let month = start.getMonth();
  const endYear = end.getFullYear();
  const endMonth = end.getMonth();

  while (year < endYear || (year === endYear && month <= endMonth)) {
    periodKeys.push(formatDateKey(new Date(year, month, 1)).slice(0, 7));
    month += 1;

    if (month > 11) {
      month = 0;
      year += 1;
    }
  }

  return periodKeys;
}

function buildEmptyPeriod(
  period: string,
  groupBy: IncomeVsExpenses['groupBy'],
): IncomeVsExpensesPeriod {
  return {
    expenses: '0.00',
    expensesAmount: 0,
    income: '0.00',
    incomeAmount: 0,
    label: formatChartPeriod(period, groupBy),
    net: '0.00',
    netAmount: 0,
    period,
  };
}

function formatChartPeriod(
  period: string,
  groupBy: IncomeVsExpenses['groupBy'],
) {
  if (groupBy === 'year') {
    return period;
  }

  const [yearText, monthText] = period.split('-');
  const year = Number(yearText ?? 0);
  const month = Number(monthText ?? 1);

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    year: 'numeric',
  }).format(new Date(year, month - 1, 1));
}
