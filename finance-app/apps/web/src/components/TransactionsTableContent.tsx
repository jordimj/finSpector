import type { ReactNode } from 'react';
import type { Transaction } from '@finance/shared';
import { TransactionRow } from './TransactionRow';
import { TransactionState } from './TransactionState';

type TransactionsTableContentProps = {
  children?: ReactNode;
  emptyDescription: string;
  emptyTitle: string;
  errorDescription?: string;
  errorTitle?: string;
  isError: boolean;
  isLoading: boolean;
  loadingRowCount?: number;
  transactions: Transaction[];
};

export function TransactionsTableContent({
  children,
  emptyDescription,
  emptyTitle,
  errorDescription = 'Check that the API is running and try again.',
  errorTitle = 'Unable to load transactions',
  isError,
  isLoading,
  loadingRowCount = 6,
  transactions,
}: TransactionsTableContentProps) {
  if (isLoading) {
    return (
      <div className='divide-y divide-line'>
        {Array.from({ length: loadingRowCount }, (_, index) => (
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

  if (isError && transactions.length === 0) {
    return (
      <TransactionState>
        <p className='text-sm font-medium text-ink'>{errorTitle}</p>
        <p className='mt-1 text-xs text-muted'>{errorDescription}</p>
      </TransactionState>
    );
  }

  if (transactions.length === 0) {
    return (
      <TransactionState>
        <p className='text-sm font-medium text-ink'>{emptyTitle}</p>
        <p className='mt-1 text-xs text-muted'>{emptyDescription}</p>
      </TransactionState>
    );
  }

  return (
    <div className='divide-y divide-line'>
      {transactions.map((transaction) => (
        <TransactionRow key={transaction.id} transaction={transaction} />
      ))}
      {children}
    </div>
  );
}
