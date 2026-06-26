import { CalendarDays, Check, ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '../lib/utils';
import type { ReportDateRange } from '../types';
import {
  formatReportDateRange,
  getAllTimeRange,
  getCurrentMonthRange,
  getCurrentYearRange,
  getLastMonthRange,
  getLastSixMonthsRange,
  getLastThirtyDaysRange,
  getLastTwelveMonthsRange,
  getLastYearRange,
} from '../utils';

export const dateRangePresets = [
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

export type DateRangePresetKey = (typeof dateRangePresets)[number]['key'];

type DateRangePickerProps = {
  align?: 'left' | 'right';
  dateRange: ReportDateRange;
  id: string;
  onChange: (
    dateRange: ReportDateRange,
    selectedPresetKey: DateRangePresetKey | null,
  ) => void;
  selectedPresetKey: DateRangePresetKey | null;
};

export function DateRangePicker({
  align = 'right',
  dateRange,
  id,
  onChange,
  selectedPresetKey,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);
  const periodLabel = formatReportDateRange(dateRange, { includeYear: true });
  const selectedPreset = dateRangePresets.find(
    (preset) => preset.key === selectedPresetKey,
  );
  const buttonLabel = selectedPreset?.label ?? periodLabel;
  const dialogId = `${id}-date-range-picker`;

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;

      if (
        target instanceof Node &&
        pickerRef.current !== null &&
        !pickerRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  function handlePresetClick(presetKey: DateRangePresetKey) {
    const preset = dateRangePresets.find((item) => item.key === presetKey);

    if (preset === undefined) {
      return;
    }

    onChange(preset.getRange(), preset.key);
    setIsOpen(false);
  }

  function handleStartDateChange(startDateValue: string) {
    const startDate = startDateValue || undefined;
    const endDate =
      startDate !== undefined &&
      (dateRange.endDate === undefined || dateRange.endDate < startDate)
        ? startDate
        : dateRange.endDate;

    onChange(buildReportDateRange(startDate, endDate), null);
  }

  function handleEndDateChange(endDateValue: string) {
    const endDate = endDateValue || undefined;
    const startDate =
      endDate !== undefined &&
      (dateRange.startDate === undefined || dateRange.startDate > endDate)
        ? endDate
        : dateRange.startDate;

    onChange(buildReportDateRange(startDate, endDate), null);
  }

  return (
    <div ref={pickerRef} className='relative'>
      <button
        type='button'
        className='inline-flex h-10 max-w-full items-center gap-2 rounded-md border border-line bg-panel-raised px-3 text-sm font-semibold text-muted-strong shadow-shell transition hover:border-accent-lavender/60 hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-lavender'
        aria-controls={dialogId}
        aria-expanded={isOpen}
        aria-haspopup='dialog'
        onClick={() => setIsOpen((current) => !current)}
      >
        <CalendarDays className='size-4 shrink-0' aria-hidden='true' />
        <span className='truncate'>{buttonLabel}</span>
        <ChevronDown
          className={cn('size-4 shrink-0 transition', isOpen && 'rotate-180')}
          aria-hidden='true'
        />
      </button>

      {isOpen && (
        <div
          id={dialogId}
          role='dialog'
          aria-label='Date range'
          className={cn(
            'absolute top-12 z-20 w-[calc(100vw-2rem)] max-w-[38rem] rounded-lg border border-line bg-panel p-3 shadow-shell sm:w-[38rem]',
            align === 'right'
              ? 'left-0 sm:left-auto sm:right-0'
              : 'left-0',
          )}
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
                        'flex h-9 items-center justify-between gap-2 rounded-md px-3 text-left text-sm font-medium text-muted-strong transition hover:bg-panel-raised hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-lavender',
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
