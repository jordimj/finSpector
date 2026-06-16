import { ArrowDownRight, ArrowUpRight, ReceiptText } from 'lucide-react';
import { LastMonthExpensesCard } from '../components/LastMonthExpensesCard';
import { RecentTransactionsCard } from '../components/RecentTransactionsCard';
import { SummaryTile } from '../components/SummaryTile';
import { useLastMonthExpenses } from '../hooks/useLastMonthExpenses';
import { formatCurrency } from '../utils';

export function DashboardPage() {
  const lastMonthExpenses = useLastMonthExpenses();
  const lastMonthTotal =
    lastMonthExpenses.data === undefined
      ? '--'
      : formatCurrency(lastMonthExpenses.data.total);

  return (
    <section className="mx-auto max-w-7xl">
      <div className="mb-6">
        <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-accent-green">
          Dashboard
        </p>
        <h1 className="text-2xl font-semibold tracking-normal text-ink md:text-3xl">
          Monthly overview
        </h1>
      </div>

      <div className="mb-4 grid gap-3 md:grid-cols-3">
        <SummaryTile
          label="Last month spent"
          value={lastMonthTotal}
          icon={<ArrowDownRight className="size-4" aria-hidden="true" />}
        />
        <SummaryTile
          label="Month income"
          value="--"
          icon={<ArrowUpRight className="size-4" aria-hidden="true" />}
        />
        <SummaryTile
          label="Net"
          value="--"
          icon={<ReceiptText className="size-4" aria-hidden="true" />}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_420px]">
        <LastMonthExpensesCard
          data={lastMonthExpenses.data}
          isError={lastMonthExpenses.isError}
          isLoading={lastMonthExpenses.isLoading}
        />

        <RecentTransactionsCard />
      </div>
    </section>
  );
}
