import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import type { RecentTransaction } from '../types';
import { formatTransactionAmount, formatTransactionDate } from '../utils';

type TransactionRowProps = {
  transaction: RecentTransaction;
};

export function TransactionRow({ transaction }: TransactionRowProps) {
  const isIncome = transaction.type === 'income';
  const Icon = isIncome ? ArrowUpRight : ArrowDownRight;
  const category =
    transaction.subcategory === null
      ? transaction.category
      : `${transaction.category} / ${transaction.subcategory}`;

  return (
    <div className='grid grid-cols-[36px_minmax(0,1fr)_86px] items-center gap-3 px-5 py-3'>
      <div
        className={[
          'flex size-9 items-center justify-center rounded-md border border-line bg-panel-raised',
          isIncome ? 'text-accent-green' : 'text-accent-rose',
        ].join(' ')}
      >
        <Icon className='size-4' aria-hidden='true' />
      </div>

      <div className='min-w-0'>
        <p className='truncate text-sm font-medium text-ink'>
          {transaction.name}
        </p>
        <p className='mt-1 truncate text-xs text-muted'>
          {formatTransactionDate(transaction.date)} · {category}
        </p>
      </div>

      <p
        className={[
          'text-right text-sm font-semibold tabular-nums',
          isIncome ? 'text-accent-green' : 'text-ink',
        ].join(' ')}
      >
        {formatTransactionAmount(transaction)}
      </p>
    </div>
  );
}
