import { Rocket, Target } from 'lucide-react';
import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import type {
  LastMonthExpensePoint,
  LastMonthExpenses,
} from '../hooks/useLastMonthExpenses';
import { formatCurrency } from '../utils';

type DashboardInsightCardProps = {
  className?: string;
  data?: LastMonthExpenses;
  isLoading: boolean;
  style?: CSSProperties;
};

export function DashboardInsightCard({
  className,
  data,
  isLoading,
  style,
}: DashboardInsightCardProps) {
  const activePeriods =
    data?.dailyExpenses.filter((point) => point.amount > 0).length ?? 0;
  const averagePeriodSpend =
    data === undefined || data.dailyExpenses.length === 0
      ? undefined
      : data.total / data.dailyExpenses.length;
  const peakPeriod = findPeakExpensePeriod(data?.dailyExpenses ?? []);

  return (
    <aside
      className={[
        'flex min-h-[24rem] flex-col justify-between rounded-lg bg-accent-lavender p-6 text-canvas shadow-shell',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={style}
    >
      <div>
        <div className='mb-7 flex items-start justify-between gap-4'>
          <span className='flex size-10 items-center justify-center rounded-md bg-canvas/10 text-canvas'>
            <Rocket className='size-5' aria-hidden='true' />
          </span>
          <span className='rounded-full bg-canvas/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-canvas/75'>
            Insight
          </span>
        </div>

        <h2 className='text-2xl font-semibold tracking-normal'>
          Spend target check
        </h2>
        <p className='mt-4 max-w-sm text-lg leading-8 text-canvas/75'>
          {isLoading
            ? 'Reading your latest spending pattern.'
            : buildInsightText(
                activePeriods,
                averagePeriodSpend,
                peakPeriod,
                data?.bucket ?? 'day',
              )}
        </p>
      </div>

      <Link
        to='/analytics'
        className='mt-8 inline-flex h-14 items-center justify-center gap-2 rounded-md bg-[#1f2390] px-5 text-base font-bold text-ink transition hover:bg-[#282eb0]'
      >
        <Target className='size-5' aria-hidden='true' />
        Review analytics
      </Link>
    </aside>
  );
}

function buildInsightText(
  activePeriods: number,
  averagePeriodSpend: number | undefined,
  peakPeriod: LastMonthExpensePoint | undefined,
  bucket: LastMonthExpenses['bucket'],
): string {
  const averageLabel = bucket === 'month' ? 'monthly' : 'daily';
  const activeLabel = bucket === 'month' ? 'active months' : 'active days';
  const peakLabel = bucket === 'month' ? 'Peak month' : 'Peak day';

  if (averagePeriodSpend === undefined) {
    return `Import transactions to unlock ${averageLabel} spend pacing and target insights.`;
  }

  if (peakPeriod === undefined || activePeriods === 0) {
    return `${formatCurrency(averagePeriodSpend)} average ${averageLabel} spend with no ${activeLabel} yet.`;
  }

  return `${formatCurrency(averagePeriodSpend)} average ${averageLabel} spend across ${activePeriods} ${activeLabel}. ${peakLabel} was ${peakPeriod.label}.`;
}

function findPeakExpensePeriod(
  points: LastMonthExpensePoint[],
): LastMonthExpensePoint | undefined {
  return points.reduce<LastMonthExpensePoint | undefined>((peak, point) => {
    if (point.amount <= 0) {
      return peak;
    }

    if (peak === undefined || point.amount > peak.amount) {
      return point;
    }

    return peak;
  }, undefined);
}
