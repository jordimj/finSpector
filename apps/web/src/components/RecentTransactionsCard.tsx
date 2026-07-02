import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { RecentTransactionsList } from './RecentTransactionsList';
import { TransactionTableHeader } from './TransactionTableHeader';

export function RecentTransactionsCard() {
  return (
    <div className='overflow-hidden rounded-lg border border-line bg-panel shadow-shell'>
      <div className='flex flex-col gap-3 px-5 py-5 sm:flex-row sm:items-center sm:justify-between'>
        <h2 className='text-xl font-semibold tracking-normal text-ink'>
          Recent transactions
        </h2>
        <Link
          to='/transactions'
          className='inline-flex h-9 w-fit items-center gap-2 rounded-md px-0 text-sm font-bold text-accent-lavender transition hover:text-ink'
        >
          View all history
          <ArrowRight className='size-4' aria-hidden='true' />
        </Link>
      </div>

      <TransactionTableHeader />
      <RecentTransactionsList />
    </div>
  );
}
