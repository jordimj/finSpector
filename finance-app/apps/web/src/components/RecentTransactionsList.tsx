import { useRecentTransactions } from '../hooks/useRecentTransactions';
import { TransactionRow } from './TransactionRow';
import { TransactionState } from './TransactionState';

export function RecentTransactionsList() {
  const recentTransactions = useRecentTransactions();
  const transactions = recentTransactions.data?.transactions ?? [];

  if (recentTransactions.isLoading) {
    return (
      <div className='divide-y divide-line'>
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className='grid gap-4 px-5 py-5 md:grid-cols-[minmax(0,1.3fr)_minmax(8rem,0.75fr)_minmax(7rem,0.65fr)_minmax(7rem,0.65fr)_minmax(7rem,0.65fr)] md:items-center'
          >
            <div className='flex min-w-0 items-center gap-3'>
              <div className='size-10 animate-pulse rounded-full bg-muted/15' />
              <div className='min-w-0 flex-1 space-y-2'>
                <div className='h-3 w-3/4 animate-pulse rounded-full bg-muted/25' />
                <div className='h-2.5 w-1/2 animate-pulse rounded-full bg-muted/15' />
              </div>
            </div>
            <div className='h-3 animate-pulse rounded-full bg-muted/20' />
            <div className='h-3 animate-pulse rounded-full bg-muted/15' />
            <div className='h-3 animate-pulse rounded-full bg-muted/15' />
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
