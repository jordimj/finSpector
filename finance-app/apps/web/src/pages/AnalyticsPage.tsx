import { CalendarDays, Check, ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { CategoriesCard } from '../components/CategoriesCard';
import { ExpenseBreakdownCard } from '../components/ExpenseBreakdownCard';
import { IncomeVsExpensesCard } from '../components/IncomeVsExpensesCard';
import { useCategorySpend } from '../hooks/useCategorySpend';
import { useIncomeVsExpenses } from '../hooks/useIncomeVsExpenses';
import { cn } from '../lib/utils';
import type { ReportDateRange } from '../types';
import {
  formatReportDateRange,
  getAllTimeRange,
  getCurrentMonthRange,
  getCurrentYearRange,
  getLastMonthRange,
  getLastSixMonthsRange,
  getLastYearRange,
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
    key: 'last-6-months',
    label: 'Last 6 months',
    getRange: () => getLastSixMonthsRange(),
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

export function AnalyticsPage() {
  const [dateRange, setDateRange] = useState<ReportDateRange>(() =>
    getCurrentMonthRange(),
  );
  const [selectedPresetKey, setSelectedPresetKey] =
    useState<DateRangePresetKey | null>('this-month');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);
  const categorySpend = useCategorySpend(dateRange);
  const incomeVsExpenses = useIncomeVsExpenses(dateRange);
  const categories = categorySpend.data?.categories ?? [];
  const total = categorySpend.data?.total ?? 0;
  const periodLabel = formatReportDateRange(dateRange);
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

  return (
    <section className='mx-auto max-w-7xl pb-8'>
      <div className='mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <h1 className='text-3xl font-semibold tracking-normal text-ink md:text-4xl'>
            Spending insights
          </h1>
          <div className='mt-3 flex flex-wrap items-center gap-3'>
            <span className='inline-flex h-6 items-center rounded-full bg-accent-green/15 px-3 text-xs font-bold uppercase tracking-[0.14em] text-accent-green'>
              Live update
            </span>
            <span className='text-sm font-medium text-muted-strong'>
              Period: {periodLabel}
            </span>
          </div>
        </div>

        <div ref={datePickerRef} className='relative self-start sm:self-auto'>
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

      <div className='grid gap-5 xl:grid-cols-[minmax(320px,0.82fr)_minmax(0,1.18fr)]'>
        <ExpenseBreakdownCard
          categories={categories}
          isError={categorySpend.isError}
          isLoading={categorySpend.isLoading}
          periodLabel={periodLabel}
          total={total}
        />

        <IncomeVsExpensesCard
          data={incomeVsExpenses.data}
          isError={incomeVsExpenses.isError}
          isLoading={incomeVsExpenses.isLoading}
          periodLabel={periodLabel}
        />
      </div>

      <div className='mt-5'>
        <CategoriesCard
          categories={categories}
          isError={categorySpend.isError}
          isLoading={categorySpend.isLoading}
          periodLabel={periodLabel}
          total={total}
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
