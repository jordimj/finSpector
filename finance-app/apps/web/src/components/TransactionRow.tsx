import { formatTransactionAmount, formatTransactionDate } from '../utils';
import { getCategoryIcon } from './categoryVisuals';
import type { Transaction } from '@finance/shared';

type TransactionRowProps = {
  transaction: Transaction;
};

export function TransactionRow({ transaction }: TransactionRowProps) {
  const isIncome = transaction.type === 'income';
  const Icon = getCategoryIcon(transaction.category);
  const category =
    transaction.subcategory === null
      ? transaction.category
      : `${transaction.category} / ${transaction.subcategory}`;
  const account = formatAccount(transaction.account);

  return (
    <div className='grid gap-4 px-5 py-5 transition hover:bg-panel-raised/30 md:grid-cols-[minmax(0,1.3fr)_minmax(8rem,0.75fr)_minmax(7rem,0.65fr)_minmax(7rem,0.65fr)_minmax(7rem,0.65fr)] md:items-center'>
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
            {category} · {account.label} ·{' '}
            {formatTransactionDate(transaction.date)}
          </p>
        </div>
      </div>

      <span className='hidden truncate text-sm font-semibold text-muted-strong md:block'>
        {category}
      </span>

      <span
        className={[
          'w-fit rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.08em]',
          account.className,
        ].join(' ')}
      >
        {account.label}
      </span>

      <span className='hidden text-sm font-medium text-muted md:block'>
        {formatTransactionDate(transaction.date)}
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
