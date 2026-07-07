import type { Transaction } from '@finance/shared';
import { TransactionTableHeader } from '../../../../components/TransactionTableHeader';
import { TransactionsTableContent } from '../../../../components/TransactionsTableContent';

type SubjectRecentTransactionsCardProps = {
  isError: boolean;
  isLoading: boolean;
  periodLabel: string;
  transactions: Transaction[];
};

export function SubjectRecentTransactionsCard({
  isError,
  isLoading,
  periodLabel,
  transactions,
}: SubjectRecentTransactionsCardProps) {
  return (
    <div className='mt-8 overflow-hidden rounded-lg border border-line bg-panel shadow-shell'>
      <div className='flex flex-col gap-2 border-b border-line px-5 py-5 sm:flex-row sm:items-start sm:justify-between'>
        <div>
          <h2 className='text-xl font-semibold tracking-normal text-ink'>
            Recent transactions
          </h2>
          <p className='mt-1 text-sm font-medium text-muted'>
            Matching rows inside {periodLabel}
          </p>
        </div>
      </div>
      <TransactionTableHeader />
      <TransactionsTableContent
        emptyDescription='Matching expenses and income will show up here.'
        emptyTitle='No matching transactions'
        isError={isError}
        isLoading={isLoading}
        loadingRowCount={5}
        transactions={transactions}
      />
    </div>
  );
}
