import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { RecentTransactionsList } from './RecentTransactionsList';

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

      <div className='hidden grid-cols-[minmax(0,1.3fr)_minmax(8rem,0.75fr)_minmax(7rem,0.65fr)_minmax(7rem,0.65fr)_minmax(7rem,0.65fr)] gap-4 border-y border-line bg-panel-raised/35 px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-muted-strong md:grid'>
        <span>Transaction</span>
        <span>Category</span>
        <span>Account</span>
        <span>Date</span>
        <span className='text-right'>Amount</span>
      </div>

      <RecentTransactionsList />
    </div>
  );
}
