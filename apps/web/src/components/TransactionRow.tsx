import { formatTransactionAmount, formatTransactionDate } from '../utils';
import { getTransactionIcon } from './categoryVisuals';
import type { Transaction } from '@finance/shared';

type TransactionRowProps = {
  transaction: Transaction;
};

export function TransactionRow({ transaction }: TransactionRowProps) {
  const isIncome = transaction.type === 'income';
  const subcategory = transaction.subcategory;
  const Icon = getTransactionIcon({
    category: transaction.category,
    subcategory,
    type: transaction.type,
  });
  const hasSubcategory = subcategory !== null && subcategory.trim().length > 0;
  const mobileCategory = hasSubcategory
    ? `${transaction.category} · ${subcategory}`
    : transaction.category;
  const account = formatAccount(transaction.account);

  return (
    <div className='grid gap-4 px-5 py-5 transition hover:bg-panel-raised/30 md:grid-cols-[minmax(0,1.1fr)_minmax(12rem,1fr)_minmax(7rem,0.6fr)_minmax(8.5rem,0.65fr)_minmax(6.75rem,0.55fr)] md:items-center'>
      <div className='flex min-w-0 items-center gap-3'>
        <span
          className={[
            'flex size-10 shrink-0 items-center justify-center rounded-full border border-line bg-panel-raised',
            isIncome ? 'text-accent-green' : 'text-accent-lavender',
          ].join(' ')}
        >
          <Icon className='size-5' aria-hidden='true' />
        </span>

        <div className='min-w-0'>
          <p className='truncate text-base font-medium text-ink'>
            {transaction.description ?? (isIncome ? 'Income' : 'Expense')}
          </p>
          <p className='mt-1 truncate text-sm text-muted md:hidden'>
            {mobileCategory} · {account.label} ·{' '}
            {formatTransactionDate(transaction.date, { includeYear: true })}
          </p>
        </div>
      </div>

      <div className='hidden min-w-0 md:block'>
        <p className='truncate text-sm font-semibold text-muted-strong'>
          {transaction.category}
        </p>
        {hasSubcategory ? (
          <p className='mt-0.5 truncate text-sm font-medium text-muted'>
            {subcategory}
          </p>
        ) : null}
      </div>

      <span
        className={[
          'w-fit rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.08em]',
          account.className,
        ].join(' ')}
      >
        {account.label}
      </span>

      <span className='hidden text-sm font-medium text-muted md:block'>
        {formatTransactionDate(transaction.date, { includeYear: true })}
      </span>

      <p
        className={[
          'text-left text-lg font-bold tabular-nums md:text-right',
          isIncome ? 'text-accent-green' : 'text-accent-rose',
        ].join(' ')}
      >
        {formatTransactionAmount(transaction)}
      </p>
    </div>
  );
}

function formatAccount(account: string | null): {
  className: string;
  label: string;
} {
  if (account === 'shared') {
    return {
      className: 'bg-accent-lavender/15 text-accent-lavender',
      label: 'Shared',
    };
  }

  if (account === 'kids') {
    return {
      className: 'bg-accent-rose/15 text-accent-rose',
      label: 'Kids',
    };
  }

  if (account === 'splitwise') {
    return {
      className: 'bg-accent-amber/15 text-accent-amber',
      label: 'Splitwise',
    };
  }

  return {
    className: 'bg-accent-green/15 text-accent-green',
    label: 'Personal',
  };
}
