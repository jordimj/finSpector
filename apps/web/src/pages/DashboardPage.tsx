import { CreditCard, PiggyBank, Users } from 'lucide-react';
import {
  getPersonalTransactionAmount,
  type Transaction,
} from '@finance/shared';
import type { CSSProperties, ReactNode } from 'react';
import { DashboardInsightCard } from '../components/DashboardInsightCard';
import { LastMonthExpensesCard } from '../components/LastMonthExpensesCard';
import { RecentTransactionsCard } from '../components/RecentTransactionsCard';
import { SummaryTile } from '../components/SummaryTile';
import { UpcomingPaymentsCard } from '../components/UpcomingPaymentsCard';
import { useLastMonthExpenses } from '../hooks/useLastMonthExpenses';
import { useRecentTransactions } from '../hooks/useRecentTransactions';
import { formatTransactionCurrency } from '../utils';

export function DashboardPage() {
  const lastMonthExpenses = useLastMonthExpenses();
  const recentTransactions = useRecentTransactions();
  const accountSummaries = buildAccountSummaries(
    recentTransactions.data?.transactions ?? [],
    recentTransactions.isLoading,
    recentTransactions.isError,
  );

  return (
    <section className='mx-auto max-w-[1600px]'>
      <div
        className='dashboard-reveal mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'
        style={getRevealStyle(0)}
      >
        <div>
          <h1 className='text-3xl font-semibold tracking-normal text-ink md:text-4xl'>
            Monthly overview
          </h1>
          <div className='mt-3 flex flex-wrap items-center gap-3'>
            <span className='inline-flex h-6 items-center rounded-full bg-accent-green/15 px-3 text-xs font-bold uppercase tracking-[0.14em] text-accent-green'>
              Dashboard
            </span>
            <span className='text-sm font-medium text-muted-strong'>
              Local spend and account activity
            </span>
          </div>
        </div>
      </div>

      <div className='grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]'>
        <LastMonthExpensesCard
          className='dashboard-reveal min-w-0'
          data={lastMonthExpenses.data}
          isError={lastMonthExpenses.isError}
          isLoading={lastMonthExpenses.isLoading}
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

      <div className='mt-8'>
        <h2
          className='dashboard-reveal mb-4 text-xl font-semibold tracking-normal text-ink'
          style={getRevealStyle(280)}
        >
          Connected accounts
        </h2>
        <div className='grid gap-5 md:grid-cols-3'>
          {accountSummaries.map((account, index) => (
            <div
              key={account.label}
              className='dashboard-reveal'
              style={getRevealStyle(350 + index * 70)}
            >
              <SummaryTile
                badge={account.badge}
                detail={account.detail}
                footer={account.footer}
                icon={account.icon}
                label={account.label}
                tone={account.tone}
                value={account.value}
              />
            </div>
          ))}
        </div>
      </div>

      <div className='dashboard-reveal mt-8' style={getRevealStyle(590)}>
        <RecentTransactionsCard />
      </div>
    </section>
  );
}

type AccountSummary = {
  badge: string;
  detail: string;
  footer: string;
  icon: ReactNode;
  label: string;
  tone: 'green' | 'lavender' | 'rose';
  value: string;
};

const accountConfigs = [
  {
    account: 'mine',
    badge: 'Personal',
    icon: <CreditCard className='size-5' aria-hidden='true' />,
    label: 'Personal Account',
    tone: 'green',
  },
  {
    account: 'shared',
    badge: 'Shared',
    icon: <Users className='size-5' aria-hidden='true' />,
    label: 'Shared Savings',
    tone: 'lavender',
  },
  {
    account: 'kids',
    badge: 'Kids',
    icon: <PiggyBank className='size-5' aria-hidden='true' />,
    label: 'Kids Fund',
    tone: 'rose',
  },
] as const;

function buildAccountSummaries(
  transactions: Transaction[],
  isLoading: boolean,
  isError: boolean,
): AccountSummary[] {
  return accountConfigs.map((config) => {
    const accountTransactions = transactions.filter(
      (transaction) => transaction.account === config.account,
    );
    const recentNet = accountTransactions.reduce((sum, transaction) => {
      const amount = getPersonalTransactionAmount(
        Number(transaction.amount),
        transaction.account,
      );

      return transaction.type === 'income' ? sum + amount : sum - amount;
    }, 0);
    const hasActivity = accountTransactions.length > 0;

    return {
      badge: config.badge,
      detail: isError
        ? 'Activity unavailable'
        : hasActivity
          ? `${accountTransactions.length} recent transactions`
          : 'No recent activity',
      footer: isError ? 'API offline' : 'Recent net',
      icon: config.icon,
      label: config.label,
      tone: config.tone,
      value: isLoading
        ? '...'
        : hasActivity
          ? formatSignedTransactionCurrency(recentNet)
          : '--',
    };
  });
}

function formatSignedTransactionCurrency(value: number): string {
  if (value === 0) {
    return formatTransactionCurrency(0);
  }

  const prefix = value > 0 ? '+' : '-';

  return `${prefix}${formatTransactionCurrency(Math.abs(value))}`;
}

function getRevealStyle(delayMs: number): CSSProperties {
  return {
    '--delay': `${delayMs}ms`,
  } as CSSProperties;
}
