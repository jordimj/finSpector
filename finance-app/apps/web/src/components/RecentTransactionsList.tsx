import { useRecentTransactions } from '../hooks/useRecentTransactions';
import { TransactionRow } from './TransactionRow';
import { TransactionState } from './TransactionState';

export function RecentTransactionsList() {
  const recentTransactions = useRecentTransactions();
  const transactions = recentTransactions.data?.transactions ?? [];

  if (recentTransactions.isLoading) {
    return (
      <div className='divide-y divide-line'>
        {Array.from({ length: 10 }, (_, index) => (
          <div
            key={index}
            className='grid grid-cols-[36px_minmax(0,1fr)_86px] items-center gap-3 px-5 py-3'
          >
            <div className='size-9 animate-pulse rounded-md border border-line bg-panel-raised' />
            <div className='min-w-0 space-y-2'>
              <div className='h-3 w-3/4 animate-pulse rounded-full bg-muted/25' />
              <div className='h-2.5 w-1/2 animate-pulse rounded-full bg-muted/15' />
            </div>
            <div className='h-3 animate-pulse rounded-full bg-muted/20' />
          </div>
        ))}
      </div>
    );
  }

  if (recentTransactions.isError) {
    return (
      <TransactionState>
        <p className='text-sm font-medium text-ink'>
          Unable to load transactions
        </p>
        <p className='mt-1 text-xs text-muted'>
          Check that the API is running and try again.
        </p>
      </TransactionState>
    );
  }

  if (transactions.length === 0) {
    return (
      <TransactionState>
        <p className='text-sm font-medium text-ink'>No transactions yet</p>
        <p className='mt-1 text-xs text-muted'>
          Imported expenses and income will show up here.
        </p>
      </TransactionState>
    );
  }

  return (
    <div className='divide-y divide-line'>
      {transactions.map((transaction) => (
        <TransactionRow key={transaction.id} transaction={transaction} />
      ))}
    </div>
  );
}
