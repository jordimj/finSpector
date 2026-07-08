import { Loader2 } from 'lucide-react';
import type { RefObject } from 'react';

export function LoadMoreStatus({
  hasNextPage,
  isError,
  isFetchingNextPage,
  loadMoreRef,
  onFetchNextPage,
}: {
  hasNextPage: boolean;
  isError: boolean;
  isFetchingNextPage: boolean;
  loadMoreRef: RefObject<HTMLDivElement | null>;
  onFetchNextPage: () => void;
}) {
  return (
    <div
      ref={loadMoreRef}
      className='flex min-h-16 items-center justify-center px-5 py-5 text-sm font-medium text-muted'
    >
      {isError ? (
        <button
          type='button'
          className='inline-flex h-9 items-center rounded-md border border-line bg-panel-raised px-3 text-sm font-semibold text-muted-strong transition hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-lavender'
          onClick={onFetchNextPage}
        >
          Try loading more
        </button>
      ) : isFetchingNextPage ? (
        <span className='inline-flex items-center gap-2'>
          <Loader2 className='size-4 animate-spin' aria-hidden='true' />
          Loading more transactions
        </span>
      ) : hasNextPage ? (
        <span>Scroll to load more</span>
      ) : (
        <span>All transactions loaded</span>
      )}
    </div>
  );
}
