import { CalendarDays, Check, ChevronDown, ChevronLeft } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CategoriesCard } from '../components/CategoriesCard';
import { ExpenseBreakdownCard } from '../components/ExpenseBreakdownCard';
import { IncomeVsExpensesCard } from '../components/IncomeVsExpensesCard';
import { useCategories } from '../hooks/useCategories';
import {
  useCategorySpend,
  type CategorySpend,
} from '../hooks/useCategorySpend';
import { useIncomeVsExpenses } from '../hooks/useIncomeVsExpenses';
import { cn } from '../lib/utils';
import type { ReportDateRange } from '../types';
import type { TransactionType } from '@finance/shared';
import {
  formatDateKey,
  formatReportDateRange,
  getAllTimeRange,
  getCurrentMonthRange,
  getCurrentYearRange,
  getLastMonthRange,
  getLastSixMonthsRange,
  getLastThirtyDaysRange,
  getLastTwelveMonthsRange,
  getLastYearRange,
  parseDateKey,
} from '../utils';

const dateRangePresets = [
  {
    key: 'this-month',
    label: 'This month',
    getRange: () => getCurrentMonthRange(),
  },
  {
    key: 'last-month',
    label: 'Last month',
    getRange: () => getLastMonthRange(),
  },
  {
    key: 'last-30-days',
    label: 'Last 30 days',
    getRange: () => getLastThirtyDaysRange(),
  },
  {
    key: 'last-6-months',
    label: 'Last 6 months',
    getRange: () => getLastSixMonthsRange(),
  },
  {
    key: 'last-12-months',
    label: 'Last 12 months',
    getRange: () => getLastTwelveMonthsRange(),
  },
  {
    key: 'this-year',
    label: 'This year',
    getRange: () => getCurrentYearRange(),
  },
  {
    key: 'last-year',
    label: 'Last year',
    getRange: () => getLastYearRange(),
  },
  {
    key: 'all-time',
    label: 'All time',
    getRange: () => getAllTimeRange(),
  },
] as const;

type DateRangePresetKey = (typeof dateRangePresets)[number]['key'];

const categoryAmountTypes = [
  { key: 'expense', label: 'Expenses' },
  { key: 'income', label: 'Incomes' },
] as const;

export function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<ReportDateRange>(() =>
    getCurrentMonthRange(),
  );
  const [categoryAmountType, setCategoryAmountType] =
    useState<TransactionType>('expense');
  const [selectedPresetKey, setSelectedPresetKey] =
    useState<DateRangePresetKey | null>('this-month');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isComparisonEnabled, setIsComparisonEnabled] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedCategoryId = parseCategoryId(searchParams.get('categoryId'));
  const comparisonRange = getComparisonDateRange(dateRange, selectedPresetKey);
  const isComparisonAvailable = comparisonRange !== undefined;
  const isComparisonActive = isComparisonEnabled && isComparisonAvailable;
  const comparisonPeriodLabel =
    comparisonRange !== undefined
      ? formatReportDateRange(comparisonRange, { includeYear: true })
      : undefined;
  const activeComparisonPeriodLabel = isComparisonActive
    ? comparisonPeriodLabel
    : undefined;

  const categorySpend = useCategorySpend(
    dateRange,
    selectedCategoryId,
    categoryAmountType,
  );
  const incomeVsExpenses = useIncomeVsExpenses(dateRange, selectedCategoryId);
  const comparisonCategorySpend = useCategorySpend(
    comparisonRange ?? dateRange,
    selectedCategoryId,
    categoryAmountType,
    isComparisonActive,
  );
  const comparisonIncomeVsExpenses = useIncomeVsExpenses(
    comparisonRange ?? dateRange,
    selectedCategoryId,
    isComparisonActive,
  );
  const activeComparisonCategorySpend = isComparisonActive
    ? comparisonCategorySpend.data
    : undefined;
  const activeComparisonIncomeVsExpenses = isComparisonActive
    ? comparisonIncomeVsExpenses.data
    : undefined;
  const categories = categorySpend.data?.categories ?? [];
  const total = categorySpend.data?.total ?? 0;
  const periodLabel = formatReportDateRange(dateRange, { includeYear: true });
  const isSubcategory = selectedCategoryId !== undefined;
  const isIncomeView = categoryAmountType === 'income';

  const { data: nestedCategories } = useCategories();
  const selectedCategory = isSubcategory
    ? nestedCategories?.find((category) => category.id === selectedCategoryId)
    : undefined;
  const selectedCategoryLabel = selectedCategory?.name ?? 'Selected category';
  const pageTitle = isSubcategory
    ? selectedCategoryLabel
    : isIncomeView
      ? 'Income insights'
      : 'Spending insights';
  const amountNoun = isIncomeView ? 'income' : 'spend';
  const allocationTitle = isSubcategory
    ? 'Subcategory allocation'
    : 'Category allocation';
  const breakdownTitle = isSubcategory
    ? 'Subcategory breakdown'
    : 'Category breakdown';
  const totalLabel = isSubcategory
    ? `${selectedCategoryLabel} ${amountNoun}`
    : isIncomeView
      ? 'Total income'
      : 'Total spend';
  const emptyTitle = isIncomeView
    ? 'No category income yet'
    : 'No category spend yet';
  const emptyDescription = isIncomeView
    ? 'Imported income transactions will show up here.'
    : 'Imported expenses will show up here.';

  const selectedPreset = dateRangePresets.find(
    (preset) => preset.key === selectedPresetKey,
  );
  const datePickerLabel = selectedPreset?.label ?? periodLabel;

  useEffect(() => {
    if (!isDatePickerOpen) {
      return undefined;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;

      if (
        target instanceof Node &&
        datePickerRef.current !== null &&
        !datePickerRef.current.contains(target)
      ) {
        setIsDatePickerOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsDatePickerOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDatePickerOpen]);

  function handlePresetClick(presetKey: DateRangePresetKey) {
    const preset = dateRangePresets.find((item) => item.key === presetKey);

    if (preset === undefined) {
      return;
    }

    setDateRange(preset.getRange());
    setSelectedPresetKey(preset.key);
    setIsDatePickerOpen(false);
  }

  function handleStartDateChange(startDateValue: string) {
    const startDate = startDateValue || undefined;

    setSelectedPresetKey(null);
    setDateRange((currentRange) => {
      const endDate =
        startDate !== undefined &&
        (currentRange.endDate === undefined || currentRange.endDate < startDate)
          ? startDate
          : currentRange.endDate;

      return buildReportDateRange(startDate, endDate);
    });
  }

  function handleEndDateChange(endDateValue: string) {
    const endDate = endDateValue || undefined;

    setSelectedPresetKey(null);
    setDateRange((currentRange) => {
      const startDate =
        endDate !== undefined &&
        (currentRange.startDate === undefined ||
          currentRange.startDate > endDate)
          ? endDate
          : currentRange.startDate;

      return buildReportDateRange(startDate, endDate);
    });
  }

  function handleCategorySelect(category: CategorySpend) {
    if (category.id === null) return;

    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.set('categoryId', String(category.id));
    setSearchParams(nextSearchParams);
  }

  function handleClearCategory() {
    const nextSearchParams = new URLSearchParams(searchParams);
    nextSearchParams.delete('categoryId');
    setSearchParams(nextSearchParams);
  }

  return (
    <section className='mx-auto max-w-[1600px]'>
      <div className='mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          {isSubcategory ? (
            <button
              type='button'
              className='mb-3 inline-flex h-9 items-center gap-2 rounded-md border border-line bg-panel px-3 text-sm font-semibold text-muted-strong transition hover:bg-panel-raised hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-lavender'
              onClick={handleClearCategory}
            >
              <ChevronLeft className='size-4 shrink-0' aria-hidden='true' />
              All categories
            </button>
          ) : null}
          <h1 className='text-3xl font-semibold tracking-normal text-ink md:text-4xl'>
            {pageTitle}
          </h1>
          <div className='mt-3 flex flex-wrap items-center gap-3'>
            <span className='inline-flex h-6 items-center rounded-full bg-accent-green/15 px-3 text-xs font-bold uppercase tracking-[0.14em] text-accent-green'>
              {isSubcategory
                ? 'Subcategory view'
                : isIncomeView
                  ? 'Income view'
                  : 'Live update'}
            </span>
            <span className='text-sm font-medium text-muted-strong'>
              Period: {periodLabel}
            </span>
            {activeComparisonPeriodLabel !== undefined ? (
              <span className='text-sm font-medium text-muted'>
                vs {activeComparisonPeriodLabel}
              </span>
            ) : null}
          </div>
        </div>

        <div className='flex flex-col gap-3 self-start sm:flex-row sm:items-center sm:self-auto'>
          <label
            className={cn(
              'inline-flex h-10 items-center gap-2 text-sm font-semibold transition',
              isComparisonAvailable
                ? 'cursor-pointer text-muted-strong hover:text-ink'
                : 'cursor-not-allowed text-muted opacity-50',
              isComparisonActive && 'text-accent-cyan hover:text-accent-cyan',
            )}
          >
            <input
              type='checkbox'
              className='peer sr-only'
              checked={isComparisonActive}
              disabled={!isComparisonAvailable}
              onChange={(event) =>
                setIsComparisonEnabled(event.currentTarget.checked)
              }
            />
            <span
              className={cn(
                'relative h-5 w-9 rounded-full bg-canvas ring-1 ring-line transition peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent-lavender',
                isComparisonActive
                  ? 'bg-accent-cyan/25 ring-accent-cyan/60'
                  : 'bg-canvas',
              )}
              aria-hidden='true'
            >
              <span
                className={cn(
                  'absolute left-0.5 top-0.5 size-4 rounded-full bg-muted-strong transition',
                  isComparisonActive && 'translate-x-4 bg-accent-cyan',
                )}
              />
            </span>
            <span className='whitespace-nowrap'>Compare previous</span>
          </label>

          <div
            className='inline-flex h-10 rounded-md border border-line bg-panel-raised p-1 shadow-shell'
            role='group'
            aria-label='Category amount type'
          >
            {categoryAmountTypes.map((option) => {
              const isSelected = option.key === categoryAmountType;

              return (
                <button
                  key={option.key}
                  type='button'
                  className={cn(
                    'rounded px-3 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-lavender',
                    isSelected
                      ? 'bg-accent-lavender text-white shadow-sm'
                      : 'text-muted-strong hover:text-ink',
                  )}
                  aria-pressed={isSelected}
                  onClick={() => setCategoryAmountType(option.key)}
                >
                  {option.label}
                </button>
              );
            })}
          </div>

          <div ref={datePickerRef} className='relative'>
            <button
              type='button'
              className='inline-flex h-10 max-w-full items-center gap-2 rounded-md border border-line bg-panel-raised px-3 text-sm font-semibold text-muted-strong shadow-shell transition hover:border-accent-lavender/60 hover:text-ink'
              aria-controls='analytics-date-range-picker'
              aria-expanded={isDatePickerOpen}
              aria-haspopup='dialog'
              onClick={() => setIsDatePickerOpen((isOpen) => !isOpen)}
            >
              <CalendarDays className='size-4 shrink-0' aria-hidden='true' />
              <span className='truncate'>{datePickerLabel}</span>
              <ChevronDown
                className={cn(
                  'size-4 shrink-0 transition',
                  isDatePickerOpen && 'rotate-180',
                )}
                aria-hidden='true'
              />
            </button>

            {isDatePickerOpen && (
              <div
                id='analytics-date-range-picker'
                role='dialog'
                aria-label='Date range'
                className='absolute left-0 top-12 z-20 w-[calc(100vw-2rem)] max-w-[38rem] rounded-lg border border-line bg-panel p-3 shadow-shell sm:left-auto sm:right-0 sm:w-[38rem]'
              >
                <div className='grid gap-3 md:grid-cols-[11rem_minmax(0,1fr)]'>
                  <div className='border-b border-line pb-3 md:border-b-0 md:border-r md:pb-0 md:pr-3'>
                    <p className='mb-2 text-xs font-semibold uppercase tracking-[0.14em] text-muted-strong'>
                      Presets
                    </p>
                    <div className='grid grid-cols-2 gap-1 md:grid-cols-1'>
                      {dateRangePresets.map((preset) => {
                        const isSelected = preset.key === selectedPresetKey;

                        return (
                          <button
                            key={preset.key}
                            type='button'
                            className={cn(
                              'flex h-9 items-center justify-between gap-2 rounded-md px-3 text-left text-sm font-medium text-muted-strong transition hover:bg-panel-raised hover:text-ink',
                              isSelected &&
                                'bg-accent-lavender/12 text-accent-lavender',
                            )}
                            aria-pressed={isSelected}
                            onClick={() => handlePresetClick(preset.key)}
                          >
                            <span className='truncate'>{preset.label}</span>
                            <Check
                              className={cn(
                                'size-4 shrink-0 transition',
                                isSelected ? 'opacity-100' : 'opacity-0',
                              )}
                              aria-hidden='true'
                            />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className='min-w-0'>
                    <p className='mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-muted-strong'>
                      Custom dates
                    </p>
                    <div className='grid gap-3 sm:grid-cols-2'>
                      <label className='grid gap-2 text-xs font-medium text-muted'>
                        From
                        <input
                          type='date'
                          value={dateRange.startDate ?? ''}
                          max={dateRange.endDate}
                          className='h-10 min-w-0 rounded-md border border-line bg-canvas px-3 text-sm font-medium text-ink outline-none transition [color-scheme:dark] focus:border-accent-lavender'
                          onChange={(event) =>
                            handleStartDateChange(event.currentTarget.value)
                          }
                        />
                      </label>

                      <label className='grid gap-2 text-xs font-medium text-muted'>
                        To
                        <input
                          type='date'
                          value={dateRange.endDate ?? ''}
                          min={dateRange.startDate}
                          className='h-10 min-w-0 rounded-md border border-line bg-canvas px-3 text-sm font-medium text-ink outline-none transition [color-scheme:dark] focus:border-accent-lavender'
                          onChange={(event) =>
                            handleEndDateChange(event.currentTarget.value)
                          }
                        />
                      </label>
                    </div>
                    <p className='mt-3 rounded-md border border-line bg-canvas px-3 py-2 text-xs font-medium text-muted-strong'>
                      {periodLabel}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className='grid gap-5 xl:grid-cols-[minmax(320px,0.82fr)_minmax(0,1.18fr)]'>
        <ExpenseBreakdownCard
          categories={categories}
          emptyDescription={emptyDescription}
          emptyTitle={emptyTitle}
          isError={categorySpend.isError}
          isLoading={categorySpend.isLoading}
          metricLabel={isIncomeView ? 'Income' : 'Spent'}
          onCategorySelect={isSubcategory ? undefined : handleCategorySelect}
          shareLabel={amountNoun}
          title={allocationTitle}
          total={total}
          totalLabel={totalLabel}
          comparisonLabel={activeComparisonPeriodLabel}
          comparisonTotal={activeComparisonCategorySpend?.total}
          comparisonType={categoryAmountType}
          isComparisonError={comparisonCategorySpend.isError}
          isComparisonLoading={comparisonCategorySpend.isLoading}
        />

        <IncomeVsExpensesCard
          data={incomeVsExpenses.data}
          comparisonData={activeComparisonIncomeVsExpenses}
          comparisonLabel={activeComparisonPeriodLabel}
          expenseLabel={isSubcategory ? selectedCategoryLabel : 'Expenses'}
          isComparisonError={comparisonIncomeVsExpenses.isError}
          isComparisonLoading={comparisonIncomeVsExpenses.isLoading}
          isError={incomeVsExpenses.isError}
          isLoading={incomeVsExpenses.isLoading}
          scopedExpenseComparison={isSubcategory}
        />
      </div>

      <div className='mt-5'>
        <CategoriesCard
          amountLabel={isIncomeView ? 'Income' : 'Spend'}
          categories={categories}
          comparisonCategories={activeComparisonCategorySpend?.categories}
          comparisonLabel={activeComparisonPeriodLabel}
          emptyDescription={emptyDescription}
          isComparisonError={comparisonCategorySpend.isError}
          isComparisonLoading={comparisonCategorySpend.isLoading}
          isError={categorySpend.isError}
          isLoading={categorySpend.isLoading}
          itemLabel={isSubcategory ? 'Subcategory' : 'Category'}
          onCategorySelect={isSubcategory ? undefined : handleCategorySelect}
          periodLabel={periodLabel}
          title={breakdownTitle}
          total={total}
          totalVerb={isIncomeView ? 'received' : 'spent'}
          type={categoryAmountType}
        />
      </div>
    </section>
  );
}

function buildReportDateRange(
  startDate: string | undefined,
  endDate: string | undefined,
): ReportDateRange {
  return {
    ...(startDate !== undefined ? { startDate } : {}),
    ...(endDate !== undefined ? { endDate } : {}),
  };
}

function getComparisonDateRange(
  range: ReportDateRange,
  presetKey: DateRangePresetKey | null,
): ReportDateRange | undefined {
  if (range.startDate === undefined || range.endDate === undefined) {
    return undefined;
  }

  const boundedRange = {
    startDate: range.startDate,
    endDate: range.endDate,
  };

  switch (presetKey) {
    case 'this-month':
    case 'last-month':
      return shiftReportDateRange(boundedRange, -1);
    case 'last-6-months':
      return shiftReportDateRange(boundedRange, -6);
    case 'last-12-months':
      return shiftReportDateRange(boundedRange, -12);
    case 'this-year':
    case 'last-year':
      return shiftReportDateRange(boundedRange, -12);
    case 'all-time':
      return undefined;
    case 'last-30-days':
    case null:
      return getPreviousEqualLengthRange(boundedRange);
  }
}

function shiftReportDateRange(
  range: BoundedReportDateRange,
  monthOffset: number,
): ReportDateRange {
  return {
    startDate: shiftDateKeyByMonths(range.startDate, monthOffset),
    endDate: shiftDateKeyByMonths(range.endDate, monthOffset),
  };
}

function shiftDateKeyByMonths(dateKey: string, monthOffset: number): string {
  const date = parseDateKey(dateKey);
  const targetYear = date.getFullYear();
  const targetMonth = date.getMonth() + monthOffset;
  const targetMonthLastDay = new Date(targetYear, targetMonth + 1, 0).getDate();
  const targetDay = Math.min(date.getDate(), targetMonthLastDay);

  return formatDateKey(new Date(targetYear, targetMonth, targetDay));
}

function getPreviousEqualLengthRange(
  range: BoundedReportDateRange,
): ReportDateRange | undefined {
  const start = parseDateKey(range.startDate);
  const end = parseDateKey(range.endDate);
  const durationDays = getDayIndex(end) - getDayIndex(start) + 1;

  if (durationDays < 1) {
    return undefined;
  }

  const previousEnd = addDays(start, -1);
  const previousStart = addDays(previousEnd, -(durationDays - 1));

  return {
    startDate: formatDateKey(previousStart),
    endDate: formatDateKey(previousEnd),
  };
}

function addDays(date: Date, dayOffset: number): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + dayOffset,
  );
}

function getDayIndex(date: Date): number {
  return Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) /
      (24 * 60 * 60 * 1000),
  );
}

type BoundedReportDateRange = {
  endDate: string;
  startDate: string;
};

function parseCategoryId(value: string | null): number | undefined {
  if (value === null) {
    return undefined;
  }

  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    return undefined;
  }

  return parsedValue;
}
