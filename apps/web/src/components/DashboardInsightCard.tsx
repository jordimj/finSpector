import { Rocket, Target } from 'lucide-react';
import { Link } from 'react-router-dom';
import type {
  LastMonthExpensePoint,
  LastMonthExpenses,
} from '../hooks/useLastMonthExpenses';
import { formatCurrency } from '../utils';

type DashboardInsightCardProps = {
  data?: LastMonthExpenses;
  isLoading: boolean;
};

export function DashboardInsightCard({
  data,
  isLoading,
}: DashboardInsightCardProps) {
  const activeDays =
    data?.dailyExpenses.filter((point) => point.amount > 0).length ?? 0;
  const averageDailySpend =
    data === undefined || data.dailyExpenses.length === 0
      ? undefined
      : data.total / data.dailyExpenses.length;
  const peakDay = findPeakExpenseDay(data?.dailyExpenses ?? []);

  return (
    <aside className='flex min-h-[24rem] flex-col justify-between rounded-lg bg-accent-lavender p-6 text-canvas shadow-shell'>
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
            ? 'Reading your latest monthly spending pattern.'
            : buildInsightText(activeDays, averageDailySpend, peakDay)}
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
  activeDays: number,
  averageDailySpend: number | undefined,
  peakDay: LastMonthExpensePoint | undefined,
): string {
  if (averageDailySpend === undefined) {
    return 'Import transactions to unlock daily spend pacing and target insights.';
  }

  if (peakDay === undefined || activeDays === 0) {
    return `${formatCurrency(averageDailySpend)} average daily spend with no active expense days yet.`;
  }

  return `${formatCurrency(averageDailySpend)} average daily spend across ${activeDays} active days. Peak day was ${peakDay.label}.`;
}

function findPeakExpenseDay(
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
