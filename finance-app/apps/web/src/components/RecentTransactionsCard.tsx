import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { RecentTransactionsList } from './RecentTransactionsList';

export function RecentTransactionsCard() {
  return (
    <div className='rounded-lg border border-line bg-panel'>
      <div className='border-b border-line px-5 py-4'>
        <h2 className='text-sm font-semibold text-ink'>Recent transactions</h2>
      </div>

      <RecentTransactionsList />

      <div className='border-t border-line px-5 py-4'>
        <Link
          to='/transactions'
          className='inline-flex h-9 w-full items-center justify-center gap-2 rounded-md border border-line bg-panel-raised px-3 text-sm font-medium text-muted-strong transition hover:border-accent-cyan/60 hover:text-ink'
        >
          View all transactions
          <ArrowRight className='size-4' aria-hidden='true' />
        </Link>
      </div>
    </div>
  );
}
