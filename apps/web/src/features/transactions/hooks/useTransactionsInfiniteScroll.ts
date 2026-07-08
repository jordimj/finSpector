import { useEffect, useRef } from 'react';

export function useTransactionsInfiniteScroll({
  fetchNextPage,
  hasNextPage,
  isError,
  isFetchingNextPage,
}: {
  fetchNextPage: () => unknown;
  hasNextPage: boolean;
  isError: boolean;
  isFetchingNextPage: boolean;
}) {
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const tableScrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadMoreElement = loadMoreRef.current;
    const tableScrollerElement = tableScrollerRef.current;

    if (
      loadMoreElement === null ||
      tableScrollerElement === null ||
      !hasNextPage ||
      isError
    ) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];

        if (firstEntry?.isIntersecting === true && !isFetchingNextPage) {
          void fetchNextPage();
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
  }, [fetchNextPage, hasNextPage, isError, isFetchingNextPage]);

  return {
    loadMoreRef,
    tableScrollerRef,
  };
}
