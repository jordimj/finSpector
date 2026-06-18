import { useRecentTransactions } from '../hooks/useRecentTransactions';
import { TransactionsTableContent } from './TransactionsTableContent';

export function RecentTransactionsList() {
  const recentTransactions = useRecentTransactions();
  const transactions = recentTransactions.data?.transactions ?? [];

  return (
    <TransactionsTableContent
      emptyDescription='Imported expenses and income will show up here.'
      emptyTitle='No transactions yet'
      isError={recentTransactions.isError}
      isLoading={recentTransactions.isLoading}
      transactions={transactions}
    />
  );
}
