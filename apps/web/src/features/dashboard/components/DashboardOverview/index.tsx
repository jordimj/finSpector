import { useState } from 'react';
import { DashboardInsightCard } from '../DashboardInsightCard';
import { LastMonthExpensesCard } from '../LastMonthExpensesCard';
import { RecentTransactionsCard } from '../RecentTransactionsCard';
import { UpcomingPaymentsCard } from '../UpcomingPaymentsCard';
import {
  useLastMonthExpenses,
  type LastMonthExpenseRange,
} from '../../hooks/useLastMonthExpenses';
import { useDashboardAccountSummaries } from '../../hooks/useDashboardAccountSummaries';
import { getRevealStyle } from '../../../../utils/getRevealStyle';
import { ConnectedAccountsSection } from './ConnectedAccountsSection';
import { DashboardHeader } from './DashboardHeader';

export function DashboardOverview() {
  const [spendRange, setSpendRange] =
    useState<LastMonthExpenseRange>('1m');
  const lastMonthExpenses = useLastMonthExpenses(spendRange);
  const accountSummaries = useDashboardAccountSummaries();

  return (
    <section className='mx-auto max-w-[1600px]'>
      <DashboardHeader style={getRevealStyle(0)} />

      <div className='grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]'>
        <LastMonthExpensesCard
          activeRange={spendRange}
          className='dashboard-reveal min-w-0'
          data={lastMonthExpenses.data}
          isError={lastMonthExpenses.isError}
          isLoading={lastMonthExpenses.isLoading}
          onRangeChange={setSpendRange}
          style={getRevealStyle(70)}
        />

        <DashboardInsightCard
          className='dashboard-reveal h-full min-w-0'
          data={lastMonthExpenses.data}
          isLoading={lastMonthExpenses.isLoading}
          style={getRevealStyle(140)}
        />
      </div>

      <div className='dashboard-reveal mt-8' style={getRevealStyle(210)}>
        <UpcomingPaymentsCard />
      </div>

      <ConnectedAccountsSection accountSummaries={accountSummaries} />

      <div className='dashboard-reveal mt-8' style={getRevealStyle(590)}>
        <RecentTransactionsCard />
      </div>
    </section>
  );
}
