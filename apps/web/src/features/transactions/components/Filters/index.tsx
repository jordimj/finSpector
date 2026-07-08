import { X } from 'lucide-react';
import {
  DateRangePicker,
  type DateRangePresetKey,
} from '../../../../components/DateRangePicker';
import {
  FilterAutocomplete,
  type FilterAutocompleteOption,
} from '../../../../components/FilterAutocomplete';
import { cn } from '../../../../lib/utils';
import type { ReportDateRange } from '../../../../types';
import type { TransactionTypeFilter } from '../../hooks/useTransactions';
import type {
  CategoryFilterOption,
  SubcategoryFilterOption,
} from '../../utils/transactionFilters';
import { TransactionTypeControl } from './TransactionTypeControl';

export function Filters({
  categoryOptions,
  dateRange,
  hasTransactionFilters,
  isCategoryLoading,
  onCategorySelect,
  onClearCategory,
  onClearSubcategory,
  onClearTransactionFilters,
  onDateRangeChange,
  onSubcategorySelect,
  onTypeSelect,
  selectedCategoryId,
  selectedPresetKey,
  selectedSubcategoryId,
  selectedTransactionType,
  subcategoryOptions,
}: {
  categoryOptions: CategoryFilterOption[];
  dateRange: ReportDateRange;
  hasTransactionFilters: boolean;
  isCategoryLoading: boolean;
  onCategorySelect: (option: FilterAutocompleteOption) => void;
  onClearCategory: () => void;
  onClearSubcategory: () => void;
  onClearTransactionFilters: () => void;
  onDateRangeChange: (
    dateRange: ReportDateRange,
    selectedPresetKey: DateRangePresetKey | null,
  ) => void;
  onSubcategorySelect: (option: FilterAutocompleteOption) => void;
  onTypeSelect: (type: TransactionTypeFilter) => void;
  selectedCategoryId: number | undefined;
  selectedPresetKey: DateRangePresetKey | null;
  selectedSubcategoryId: number | undefined;
  selectedTransactionType: TransactionTypeFilter;
  subcategoryOptions: SubcategoryFilterOption[];
}) {
  return (
    <div className='mb-5 grid shrink-0 gap-3 rounded-lg border border-line bg-panel p-3 shadow-shell md:grid-cols-2 xl:grid-cols-[minmax(13rem,0.8fr)_minmax(14rem,1fr)_minmax(14rem,1fr)_minmax(14rem,1fr)_auto] xl:items-end'>
      <TransactionTypeControl
        selectedTransactionType={selectedTransactionType}
        onSelect={onTypeSelect}
      />

      <div className='grid gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-strong'>
        Date
        <DateRangePicker
          align='left'
          dateRange={dateRange}
          id='transactions'
          selectedPresetKey={selectedPresetKey}
          onChange={onDateRangeChange}
        />
      </div>

      <FilterAutocomplete
        id='transaction-category-filter'
        isLoading={isCategoryLoading}
        label='Category'
        options={categoryOptions}
        placeholder='All categories'
        selectedValue={
          selectedCategoryId === undefined
            ? undefined
            : String(selectedCategoryId)
        }
        onClear={onClearCategory}
        onSelect={onCategorySelect}
      />

      <FilterAutocomplete
        disabled={isCategoryLoading}
        id='transaction-subcategory-filter'
        isLoading={isCategoryLoading}
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
        onClear={onClearSubcategory}
        onSelect={onSubcategorySelect}
      />

      <button
        type='button'
        className={cn(
          'inline-flex h-10 items-center justify-center gap-2 rounded-md border border-line bg-panel-raised px-3 text-sm font-semibold text-muted-strong shadow-shell transition hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-lavender xl:mb-0',
          !hasTransactionFilters && 'pointer-events-none opacity-50',
        )}
        disabled={!hasTransactionFilters}
        onClick={onClearTransactionFilters}
      >
        <X className='size-4' aria-hidden='true' />
        Clear
      </button>
    </div>
  );
}
