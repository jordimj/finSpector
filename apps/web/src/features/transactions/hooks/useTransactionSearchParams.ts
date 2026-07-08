import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { DateRangePresetKey } from '../../../components/DateRangePicker';
import type { ReportDateRange } from '../../../types';
import type { FilterAutocompleteOption } from '../components/Filters/FilterAutocomplete';
import type { TransactionTypeFilter } from './useTransactions';
import {
  buildReportDateRange,
  getSelectedPresetKey,
  parseDateParam,
  parsePositiveInteger,
  parseTransactionType,
  setOptionalSearchParam,
  type SubcategoryFilterOption,
} from '../utils/transactionFilters';

export function useTransactionSearchParams() {
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

  function handleSubcategorySelect(
    option: FilterAutocompleteOption,
    subcategoryOptions: SubcategoryFilterOption[],
  ) {
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

  return {
    dateRange,
    descriptionSearch,
    onCategorySelect: handleCategorySelect,
    onClearCategory: handleClearCategory,
    onClearSubcategory: handleClearSubcategory,
    onClearTransactionFilters: handleClearTransactionFilters,
    onDateRangeChange: handleDateRangeChange,
    onSubcategorySelect: handleSubcategorySelect,
    onTypeSelect: handleTypeSelect,
    selectedCategoryId,
    selectedPresetKey,
    selectedSubcategoryId,
    selectedTransactionType,
  };
}
