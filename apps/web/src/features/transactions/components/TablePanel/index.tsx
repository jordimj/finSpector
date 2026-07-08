import type { Transaction } from '@finance/shared';
import type { RefObject } from 'react';
import { TransactionTableHeader } from '../../../../components/TransactionTableHeader';
import { TransactionsTableContent } from '../../../../components/TransactionsTableContent';
import { LoadMoreStatus } from './LoadMoreStatus';

export function TablePanel({
  hasAnyFilter,
  hasNextPage,
  isError,
  isFetchingNextPage,
  isInitialLoading,
  loadMoreRef,
  onFetchNextPage,
  tableScrollerRef,
  transactions,
}: {
  hasAnyFilter: boolean;
  hasNextPage: boolean;
  isError: boolean;
  isFetchingNextPage: boolean;
  isInitialLoading: boolean;
  loadMoreRef: RefObject<HTMLDivElement | null>;
  onFetchNextPage: () => void;
  tableScrollerRef: RefObject<HTMLDivElement | null>;
  transactions: Transaction[];
}) {
  return (
    <div className='flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-line bg-panel shadow-shell'>
      <TransactionTableHeader />
      <div ref={tableScrollerRef} className='min-h-0 flex-1 overflow-y-auto'>
        <TransactionsTableContent
          emptyDescription={
            hasAnyFilter
              ? 'No imported transactions match the selected filters.'
              : 'Imported expenses and income will show up here.'
          }
          emptyTitle={
            hasAnyFilter ? 'No matching transactions' : 'No transactions yet'
          }
          isError={isError}
          isLoading={isInitialLoading}
          loadingRowCount={10}
          transactions={transactions}
        >
          <LoadMoreStatus
            hasNextPage={hasNextPage}
            isError={isError}
            isFetchingNextPage={isFetchingNextPage}
            loadMoreRef={loadMoreRef}
            onFetchNextPage={onFetchNextPage}
          />
        </TransactionsTableContent>
      </div>
    </div>
  );
}
