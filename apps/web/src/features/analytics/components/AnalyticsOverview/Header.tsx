import { ChevronLeft } from 'lucide-react';
import type { TransactionType } from '@finance/shared';
import {
  DateRangePicker,
  type DateRangePresetKey,
} from '../../../../components/DateRangePicker';
import type { ReportDateRange } from '../../../../types';
import { AmountTypeControl } from './AmountTypeControl';
import { ComparisonToggle } from './ComparisonToggle';

type HeaderProps = {
  activeComparisonPeriodLabel?: string;
  categoryAmountType: TransactionType;
  dateRange: ReportDateRange;
  isComparisonActive: boolean;
  isComparisonAvailable: boolean;
  isIncomeView: boolean;
  isSubcategory: boolean;
  pageTitle: string;
  periodLabel: string;
  selectedPresetKey: DateRangePresetKey | null;
  onCategoryAmountTypeChange: (type: TransactionType) => void;
  onClearCategory: () => void;
  onComparisonEnabledChange: (isEnabled: boolean) => void;
  onDateRangeChange: (
    nextDateRange: ReportDateRange,
    nextPresetKey: DateRangePresetKey | null,
  ) => void;
};

export function Header({
  activeComparisonPeriodLabel,
  categoryAmountType,
  dateRange,
  isComparisonActive,
  isComparisonAvailable,
  isIncomeView,
  isSubcategory,
  pageTitle,
  periodLabel,
  selectedPresetKey,
  onCategoryAmountTypeChange,
  onClearCategory,
  onComparisonEnabledChange,
  onDateRangeChange,
}: HeaderProps) {
  return (
    <div className='mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
      <div>
        {isSubcategory ? (
          <button
            type='button'
            className='mb-3 inline-flex h-9 items-center gap-2 rounded-md border border-line bg-panel px-3 text-sm font-semibold text-muted-strong transition hover:bg-panel-raised hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-lavender'
            onClick={onClearCategory}
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
        <ComparisonToggle
          isComparisonActive={isComparisonActive}
          isComparisonAvailable={isComparisonAvailable}
          onComparisonEnabledChange={onComparisonEnabledChange}
        />

        <AmountTypeControl
          categoryAmountType={categoryAmountType}
          onCategoryAmountTypeChange={onCategoryAmountTypeChange}
        />

        <DateRangePicker
          dateRange={dateRange}
          id='analytics'
          selectedPresetKey={selectedPresetKey}
          onChange={onDateRangeChange}
        />
      </div>
    </div>
  );
}
