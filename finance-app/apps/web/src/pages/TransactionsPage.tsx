import { Loader2 } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import { TransactionTableHeader } from '../components/TransactionTableHeader';
import { TransactionsTableContent } from '../components/TransactionsTableContent';
import { useTransactions } from '../hooks/useTransactions';

export function TransactionsPage() {
  const transactionsQuery = useTransactions();
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const tableScrollerRef = useRef<HTMLDivElement>(null);
  const transactions = useMemo(
    () =>
      transactionsQuery.data?.pages.flatMap((page) => page.transactions) ?? [],
    [transactionsQuery.data],
  );
  const isInitialLoading =
    transactionsQuery.isLoading && transactions.length === 0;

  useEffect(() => {
    const loadMoreElement = loadMoreRef.current;
    const tableScrollerElement = tableScrollerRef.current;

    if (
      loadMoreElement === null ||
      tableScrollerElement === null ||
      !transactionsQuery.hasNextPage ||
      transactionsQuery.isError
    ) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];

        if (
          firstEntry?.isIntersecting === true &&
          !transactionsQuery.isFetchingNextPage
        ) {
          void transactionsQuery.fetchNextPage();
        }
      },
      {
        root: tableScrollerElement,
        rootMargin: '320px',
      },
    );

    observer.observe(loadMoreElement);

    return () => {
      observer.disconnect();
    };
  }, [
    transactionsQuery.fetchNextPage,
    transactionsQuery.hasNextPage,
    transactionsQuery.isError,
    transactionsQuery.isFetchingNextPage,
  ]);

  return (
    <section className='mx-auto flex h-full min-h-0 max-h-screen max-w-7xl flex-col'>
      <div className='mb-7 flex shrink-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <h1 className='text-3xl font-semibold tracking-normal text-ink md:text-4xl'>
            Transactions
          </h1>
          <div className='mt-3 flex flex-wrap items-center gap-3'>
            <span className='inline-flex h-6 items-center rounded-full bg-accent-green/15 px-3 text-xs font-bold uppercase tracking-[0.14em] text-accent-green'>
              All history
            </span>
            <span className='text-sm font-medium text-muted-strong'>
              {transactions.length > 0
                ? `${transactions.length} loaded`
                : 'Every imported transaction in one place'}
            </span>
          </div>
        </div>
      </div>

      <div className='flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-line bg-panel shadow-shell'>
        <TransactionTableHeader />
        <div ref={tableScrollerRef} className='min-h-0 flex-1 overflow-y-auto'>
          <TransactionsTableContent
            emptyDescription='Imported expenses and income will show up here.'
            emptyTitle='No transactions yet'
            isError={transactionsQuery.isError}
            isLoading={isInitialLoading}
            loadingRowCount={10}
            transactions={transactions}
          >
            <div
              ref={loadMoreRef}
              className='flex min-h-16 items-center justify-center px-5 py-5 text-sm font-medium text-muted'
            >
              {transactionsQuery.isError ? (
                <button
                  type='button'
                  className='inline-flex h-9 items-center rounded-md border border-line bg-panel-raised px-3 text-sm font-semibold text-muted-strong transition hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-lavender'
                  onClick={() => void transactionsQuery.fetchNextPage()}
                >
                  Try loading more
                </button>
              ) : transactionsQuery.isFetchingNextPage ? (
                <span className='inline-flex items-center gap-2'>
                  <Loader2
                    className='size-4 animate-spin'
                    aria-hidden='true'
                  />
                  Loading more transactions
                </span>
              ) : transactionsQuery.hasNextPage ? (
                <span>Scroll to load more</span>
              ) : (
                <span>All transactions loaded</span>
              )}
            </div>
          </TransactionsTableContent>
        </div>
      </div>
    </section>
  );
}
