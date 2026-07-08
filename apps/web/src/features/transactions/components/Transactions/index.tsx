import { useMemo } from 'react';
import { useCategories } from '../../../../hooks/useCategories';
import { formatReportDateRange } from '../../../../utils';
import { useTransactionFilterOptions } from '../../hooks/useTransactionFilterOptions';
import { useTransactionSearchParams } from '../../hooks/useTransactionSearchParams';
import { useTransactions } from '../../hooks/useTransactions';
import { useTransactionsInfiniteScroll } from '../../hooks/useTransactionsInfiniteScroll';
import { Filters } from '../Filters';
import { TablePanel } from '../TablePanel';
import { Header } from './Header';

export function Transactions() {
  const transactionSearchParams = useTransactionSearchParams();
  const {
    dateRange,
    descriptionSearch,
    selectedCategoryId,
    selectedPresetKey,
    selectedSubcategoryId,
    selectedTransactionType,
  } = transactionSearchParams;
  const transactionsQuery = useTransactions({
    categoryId: selectedCategoryId,
    dateRange,
    search: descriptionSearch,
    subcategoryId: selectedSubcategoryId,
    type: selectedTransactionType,
  });
  const categoriesQuery = useCategories(
    selectedTransactionType === 'all' ? undefined : selectedTransactionType,
  );
  const transactions = useMemo(
    () =>
      transactionsQuery.data?.pages.flatMap((page) => page.transactions) ?? [],
    [transactionsQuery.data],
  );
  const { categoryOptions, subcategoryOptions } = useTransactionFilterOptions({
    categories: categoriesQuery.data ?? [],
    selectedCategoryId,
  });
  const hasDateFilter =
    dateRange.startDate !== undefined || dateRange.endDate !== undefined;
  const hasTransactionFilters =
    hasDateFilter ||
    selectedTransactionType !== 'all' ||
    selectedCategoryId !== undefined ||
    selectedSubcategoryId !== undefined;
  const hasAnyFilter = descriptionSearch !== '' || hasTransactionFilters;
  const periodLabel = formatReportDateRange(dateRange, { includeYear: true });
  const isInitialLoading =
    transactionsQuery.isLoading && transactions.length === 0;
  const transactionCountLabel = hasAnyFilter
    ? transactions.length > 0
      ? `${transactions.length} matching loaded`
      : 'Filtering transaction history'
    : transactions.length > 0
      ? `${transactions.length} loaded`
      : 'Every imported transaction in one place';
  const { loadMoreRef, tableScrollerRef } = useTransactionsInfiniteScroll({
    fetchNextPage: transactionsQuery.fetchNextPage,
    hasNextPage: transactionsQuery.hasNextPage,
    isError: transactionsQuery.isError,
    isFetchingNextPage: transactionsQuery.isFetchingNextPage,
  });

  return (
    <section className='mx-auto flex h-full min-h-0 max-h-screen max-w-[1600px] flex-col'>
      <Header
        hasAnyFilter={hasAnyFilter}
        hasDateFilter={hasDateFilter}
        periodLabel={periodLabel}
        transactionCountLabel={transactionCountLabel}
      />

      <Filters
        categoryOptions={categoryOptions}
        dateRange={dateRange}
        hasTransactionFilters={hasTransactionFilters}
        isCategoryLoading={categoriesQuery.isLoading}
        selectedCategoryId={selectedCategoryId}
        selectedPresetKey={selectedPresetKey}
        selectedSubcategoryId={selectedSubcategoryId}
        selectedTransactionType={selectedTransactionType}
        subcategoryOptions={subcategoryOptions}
        onCategorySelect={transactionSearchParams.onCategorySelect}
        onClearCategory={transactionSearchParams.onClearCategory}
        onClearSubcategory={transactionSearchParams.onClearSubcategory}
        onClearTransactionFilters={
          transactionSearchParams.onClearTransactionFilters
        }
        onDateRangeChange={transactionSearchParams.onDateRangeChange}
        onSubcategorySelect={(option) =>
          transactionSearchParams.onSubcategorySelect(
            option,
            subcategoryOptions,
          )
        }
        onTypeSelect={transactionSearchParams.onTypeSelect}
      />

      <TablePanel
        hasAnyFilter={hasAnyFilter}
        hasNextPage={transactionsQuery.hasNextPage}
        isError={transactionsQuery.isError}
        isFetchingNextPage={transactionsQuery.isFetchingNextPage}
        isInitialLoading={isInitialLoading}
        loadMoreRef={loadMoreRef}
        tableScrollerRef={tableScrollerRef}
        transactions={transactions}
        onFetchNextPage={() => void transactionsQuery.fetchNextPage()}
      />
    </section>
  );
}
