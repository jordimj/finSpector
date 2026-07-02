import { Loader2, X } from 'lucide-react';
import { useEffect, useMemo, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  DateRangePicker,
  dateRangePresets,
  type DateRangePresetKey,
} from '../components/DateRangePicker';
import {
  FilterAutocomplete,
  type FilterAutocompleteOption,
} from '../components/FilterAutocomplete';
import { TransactionTableHeader } from '../components/TransactionTableHeader';
import { TransactionsTableContent } from '../components/TransactionsTableContent';
import { useCategories } from '../hooks/useCategories';
import {
  useTransactions,
  type TransactionTypeFilter,
} from '../hooks/useTransactions';
import { cn } from '../lib/utils';
import type { ReportDateRange } from '../types';
import { formatReportDateRange } from '../utils';

const transactionTypeOptions: Array<{
  key: TransactionTypeFilter;
  label: string;
}> = [
  { key: 'all', label: 'All' },
  { key: 'expense', label: 'Expenses' },
  { key: 'income', label: 'Income' },
];

export function TransactionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const descriptionSearch = searchParams.get('search')?.trim() ?? '';
  const selectedTransactionType = parseTransactionType(searchParams.get('type'));
  const selectedCategoryId = parsePositiveInteger(
    searchParams.get('categoryId'),
  );
  const selectedSubcategoryId = parsePositiveInteger(
    searchParams.get('subcategoryId'),
  );
  const fromDate = parseDateParam(searchParams.get('from'));
  const toDate = parseDateParam(searchParams.get('to'));
  const dateRange = useMemo(
    () => buildReportDateRange(fromDate, toDate),
    [fromDate, toDate],
  );
  const selectedPresetKey = getSelectedPresetKey(
    searchParams.get('period'),
    dateRange,
  );
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
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const tableScrollerRef = useRef<HTMLDivElement>(null);
  const transactions = useMemo(
    () =>
      transactionsQuery.data?.pages.flatMap((page) => page.transactions) ?? [],
    [transactionsQuery.data],
  );
  const categories = categoriesQuery.data ?? [];
  const categoryOptions = useMemo<CategoryFilterOption[]>(
    () =>
      categories.map((category) => ({
        id: category.id,
        label: category.name,
        value: String(category.id),
      })),
    [categories],
  );
  const subcategoryOptions = useMemo<SubcategoryFilterOption[]>(() => {
    const sourceCategories =
      selectedCategoryId === undefined
        ? categories
        : categories.filter((category) => category.id === selectedCategoryId);

    return sourceCategories.flatMap((category) =>
      category.subcategories.map((subcategory) => ({
        categoryId: category.id,
        detail: category.name,
        id: subcategory.id,
        label: subcategory.name,
        value: String(subcategory.id),
      })),
    );
  }, [categories, selectedCategoryId]);
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
  const transactionCountLabel =
    hasAnyFilter
      ? transactions.length > 0
        ? `${transactions.length} matching loaded`
        : 'Filtering transaction history'
      : transactions.length > 0
        ? `${transactions.length} loaded`
        : 'Every imported transaction in one place';

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

  function updateTransactionSearchParams(
    updater: (nextSearchParams: URLSearchParams) => void,
  ) {
    const nextSearchParams = new URLSearchParams(searchParams);

    updater(nextSearchParams);
    setSearchParams(nextSearchParams);
  }

  function handleDateRangeChange(
    nextDateRange: ReportDateRange,
    nextPresetKey: DateRangePresetKey | null,
  ) {
    updateTransactionSearchParams((nextSearchParams) => {
      setOptionalSearchParam(
        nextSearchParams,
        'from',
        nextDateRange.startDate,
      );
      setOptionalSearchParam(nextSearchParams, 'to', nextDateRange.endDate);

      if (nextPresetKey === null) {
        nextSearchParams.delete('period');
      } else {
        nextSearchParams.set('period', nextPresetKey);
      }
    });
  }

  function handleTypeSelect(type: TransactionTypeFilter) {
    updateTransactionSearchParams((nextSearchParams) => {
      if (type === 'all') {
        nextSearchParams.delete('type');
      } else {
        nextSearchParams.set('type', type);
      }

      nextSearchParams.delete('categoryId');
      nextSearchParams.delete('subcategoryId');
    });
  }

  function handleCategorySelect(option: FilterAutocompleteOption) {
    updateTransactionSearchParams((nextSearchParams) => {
      nextSearchParams.set('categoryId', option.value);
      nextSearchParams.delete('subcategoryId');
    });
  }

  function handleSubcategorySelect(option: FilterAutocompleteOption) {
    const subcategory = subcategoryOptions.find(
      (item) => item.value === option.value,
    );

    if (subcategory === undefined) {
      return;
    }

    updateTransactionSearchParams((nextSearchParams) => {
      nextSearchParams.set('categoryId', String(subcategory.categoryId));
      nextSearchParams.set('subcategoryId', String(subcategory.id));
    });
  }

  function handleClearCategory() {
    updateTransactionSearchParams((nextSearchParams) => {
      nextSearchParams.delete('categoryId');
      nextSearchParams.delete('subcategoryId');
    });
  }

  function handleClearSubcategory() {
    updateTransactionSearchParams((nextSearchParams) => {
      nextSearchParams.delete('subcategoryId');
    });
  }

  function handleClearTransactionFilters() {
    updateTransactionSearchParams((nextSearchParams) => {
      nextSearchParams.delete('categoryId');
      nextSearchParams.delete('from');
      nextSearchParams.delete('period');
      nextSearchParams.delete('subcategoryId');
      nextSearchParams.delete('to');
      nextSearchParams.delete('type');
    });
  }

  return (
    <section className='mx-auto flex h-full min-h-0 max-h-screen max-w-[1600px] flex-col'>
      <div className='mb-7 flex shrink-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <h1 className='text-3xl font-semibold tracking-normal text-ink md:text-4xl'>
            Transactions
          </h1>
          <div className='mt-3 flex flex-wrap items-center gap-3'>
            <span className='inline-flex h-6 items-center rounded-full bg-accent-green/15 px-3 text-xs font-bold uppercase tracking-[0.14em] text-accent-green'>
              {hasAnyFilter ? 'Filtered history' : 'All history'}
            </span>
            <span className='text-sm font-medium text-muted-strong'>
              {transactionCountLabel}
            </span>
            {hasDateFilter ? (
              <span className='text-sm font-medium text-muted'>
                Period: {periodLabel}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className='mb-5 grid shrink-0 gap-3 rounded-lg border border-line bg-panel p-3 shadow-shell md:grid-cols-2 xl:grid-cols-[minmax(13rem,0.8fr)_minmax(14rem,1fr)_minmax(14rem,1fr)_minmax(14rem,1fr)_auto] xl:items-end'>
        <div className='grid gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-strong'>
          Type
          <div
            className='grid h-10 grid-cols-3 rounded-md border border-line bg-panel-raised p-1 shadow-shell'
            role='group'
            aria-label='Transaction type'
          >
            {transactionTypeOptions.map((option) => {
              const isSelected = option.key === selectedTransactionType;

              return (
                <button
                  key={option.key}
                  type='button'
                  className={cn(
                    'rounded px-2 text-sm font-semibold normal-case tracking-normal transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-lavender',
                    isSelected
                      ? 'bg-accent-lavender text-white shadow-sm'
                      : 'text-muted-strong hover:text-ink',
                  )}
                  aria-pressed={isSelected}
                  onClick={() => handleTypeSelect(option.key)}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className='grid gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-strong'>
          Date
          <DateRangePicker
            align='left'
            dateRange={dateRange}
            id='transactions'
            selectedPresetKey={selectedPresetKey}
            onChange={handleDateRangeChange}
          />
        </div>

        <FilterAutocomplete
          id='transaction-category-filter'
          isLoading={categoriesQuery.isLoading}
          label='Category'
          options={categoryOptions}
          placeholder='All categories'
          selectedValue={
            selectedCategoryId === undefined
              ? undefined
              : String(selectedCategoryId)
          }
          onClear={handleClearCategory}
          onSelect={handleCategorySelect}
        />

        <FilterAutocomplete
          disabled={categoriesQuery.isLoading}
          id='transaction-subcategory-filter'
          isLoading={categoriesQuery.isLoading}
          label='Subcategory'
          options={subcategoryOptions}
          placeholder={
            selectedCategoryId === undefined
              ? 'All subcategories'
              : 'Pick a subcategory'
          }
          selectedValue={
            selectedSubcategoryId === undefined
              ? undefined
              : String(selectedSubcategoryId)
          }
          onClear={handleClearSubcategory}
          onSelect={handleSubcategorySelect}
        />

        <button
          type='button'
          className={cn(
            'inline-flex h-10 items-center justify-center gap-2 rounded-md border border-line bg-panel-raised px-3 text-sm font-semibold text-muted-strong shadow-shell transition hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-lavender xl:mb-0',
            !hasTransactionFilters && 'pointer-events-none opacity-50',
          )}
          disabled={!hasTransactionFilters}
          onClick={handleClearTransactionFilters}
        >
          <X className='size-4' aria-hidden='true' />
          Clear
        </button>
      </div>

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
                  <Loader2 className='size-4 animate-spin' aria-hidden='true' />
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

type CategoryFilterOption = FilterAutocompleteOption & {
  id: number;
};

type SubcategoryFilterOption = FilterAutocompleteOption & {
  categoryId: number;
  id: number;
};

function buildReportDateRange(
  startDate: string | undefined,
  endDate: string | undefined,
): ReportDateRange {
  return {
    ...(startDate !== undefined ? { startDate } : {}),
    ...(endDate !== undefined ? { endDate } : {}),
  };
}

function parseTransactionType(value: string | null): TransactionTypeFilter {
  return value === 'expense' || value === 'income' ? value : 'all';
}

function parsePositiveInteger(value: string | null): number | undefined {
  if (value === null) {
    return undefined;
  }

  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    return undefined;
  }

  return parsedValue;
}

function parseDateParam(value: string | null): string | undefined {
  return value !== null && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? value
    : undefined;
}

function getSelectedPresetKey(
  value: string | null,
  dateRange: ReportDateRange,
): DateRangePresetKey | null {
  const presetKey = dateRangePresets.find((preset) => preset.key === value)?.key;

  if (presetKey !== undefined) {
    return presetKey;
  }

  if (dateRange.startDate === undefined && dateRange.endDate === undefined) {
    return 'all-time';
  }

  return null;
}

function setOptionalSearchParam(
  searchParams: URLSearchParams,
  key: string,
  value: string | undefined,
) {
  if (value === undefined) {
    searchParams.delete(key);
  } else {
    searchParams.set(key, value);
  }
}
