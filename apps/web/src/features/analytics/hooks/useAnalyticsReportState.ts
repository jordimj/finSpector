import type { TransactionType } from '@finance/shared';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { DateRangePresetKey } from '../../../components/DateRangePicker';
import { useCategories } from '../../../hooks/useCategories';
import {
  useCategorySpend,
  type CategorySpend,
} from '../../../hooks/useCategorySpend';
import { useIncomeVsExpenses } from '../../../hooks/useIncomeVsExpenses';
import type { ReportDateRange } from '../../../types';
import {
  formatReportDateRange,
  getCurrentMonthRange,
} from '../../../utils';
import { getComparisonDateRange } from '../utils/comparisonDateRange';
import { parseCategoryId } from '../utils/parseCategoryId';

export function useAnalyticsReportState() {
  const [dateRange, setDateRange] = useState<ReportDateRange>(() =>
    getCurrentMonthRange(),
  );
  const [categoryAmountType, setCategoryAmountType] =
    useState<TransactionType>('expense');
  const [selectedPresetKey, setSelectedPresetKey] =
    useState<DateRangePresetKey | null>('this-month');
  const [isComparisonEnabled, setIsComparisonEnabled] = useState(false);
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

  function handleDateRangeChange(
    nextDateRange: ReportDateRange,
    nextPresetKey: DateRangePresetKey | null,
  ) {
    setDateRange(nextDateRange);
    setSelectedPresetKey(nextPresetKey);
  }

  return {
    activeComparisonCategorySpend,
    activeComparisonIncomeVsExpenses,
    activeComparisonPeriodLabel,
    allocationTitle,
    amountNoun,
    breakdownTitle,
    categories,
    categoryAmountType,
    categorySpend,
    comparisonCategorySpend,
    comparisonIncomeVsExpenses,
    dateRange,
    emptyDescription,
    emptyTitle,
    handleCategorySelect,
    handleClearCategory,
    handleDateRangeChange,
    incomeVsExpenses,
    isComparisonActive,
    isComparisonAvailable,
    isIncomeView,
    isSubcategory,
    pageTitle,
    periodLabel,
    selectedCategoryLabel,
    selectedPresetKey,
    setCategoryAmountType,
    setIsComparisonEnabled,
    total,
    totalLabel,
  };
}
