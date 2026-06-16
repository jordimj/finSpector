import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import type {
  ChildrenProps,
  RecentTransactionsListProps,
  TransactionRowProps,
} from '../types';
import { formatTransactionAmount, formatTransactionDate } from '../utils';

export function RecentTransactionsList({
  isError,
  isLoading,
  transactions,
}: RecentTransactionsListProps) {
  if (isLoading) {
    return (
      <div className="divide-y divide-line">
        {Array.from({ length: 10 }, (_, index) => (
          <div
            key={index}
            className="grid grid-cols-[36px_minmax(0,1fr)_86px] items-center gap-3 px-5 py-3"
          >
            <div className="size-9 animate-pulse rounded-md border border-line bg-panel-raised" />
            <div className="min-w-0 space-y-2">
              <div className="h-3 w-3/4 animate-pulse rounded-full bg-muted/25" />
              <div className="h-2.5 w-1/2 animate-pulse rounded-full bg-muted/15" />
            </div>
            <div className="h-3 animate-pulse rounded-full bg-muted/20" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <TransactionState>
        <p className="text-sm font-medium text-ink">
          Unable to load transactions
        </p>
        <p className="mt-1 text-xs text-muted">
          Check that the API is running and try again.
        </p>
      </TransactionState>
    );
  }

  if (transactions.length === 0) {
    return (
      <TransactionState>
        <p className="text-sm font-medium text-ink">No transactions yet</p>
        <p className="mt-1 text-xs text-muted">
          Imported expenses and income will show up here.
        </p>
      </TransactionState>
    );
  }

  return (
    <div className="divide-y divide-line">
      {transactions.map((transaction) => (
        <TransactionRow key={transaction.id} transaction={transaction} />
      ))}
    </div>
  );
}

function TransactionRow({ transaction }: TransactionRowProps) {
  const isIncome = transaction.type === 'income';
  const Icon = isIncome ? ArrowUpRight : ArrowDownRight;
  const category =
    transaction.subcategory === null
      ? transaction.category
      : `${transaction.category} / ${transaction.subcategory}`;

  return (
    <div className="grid grid-cols-[36px_minmax(0,1fr)_86px] items-center gap-3 px-5 py-3">
      <div
        className={[
          'flex size-9 items-center justify-center rounded-md border border-line bg-panel-raised',
          isIncome ? 'text-accent-green' : 'text-accent-rose',
        ].join(' ')}
      >
        <Icon className="size-4" aria-hidden="true" />
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-ink">
          {transaction.name}
        </p>
        <p className="mt-1 truncate text-xs text-muted">
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

function TransactionState({ children }: ChildrenProps) {
  return (
    <div className="flex min-h-[180px] items-center justify-center px-5 py-8 text-center">
      <div>{children}</div>
    </div>
  );
}
