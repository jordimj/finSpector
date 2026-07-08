import {
  dateRangePresets,
  type DateRangePresetKey,
} from '../../../components/DateRangePicker';
import type { FilterAutocompleteOption } from '../../../components/FilterAutocomplete';
import type { ReportDateRange } from '../../../types';
import type { TransactionTypeFilter } from '../hooks/useTransactions';

export type CategoryFilterOption = FilterAutocompleteOption & {
  id: number;
};

export type SubcategoryFilterOption = FilterAutocompleteOption & {
  categoryId: number;
  id: number;
};

export const transactionTypeOptions: Array<{
  key: TransactionTypeFilter;
  label: string;
}> = [
  { key: 'all', label: 'All' },
  { key: 'expense', label: 'Expenses' },
  { key: 'income', label: 'Income' },
];

export function buildReportDateRange(
  startDate: string | undefined,
  endDate: string | undefined,
): ReportDateRange {
  return {
    ...(startDate !== undefined ? { startDate } : {}),
    ...(endDate !== undefined ? { endDate } : {}),
  };
}

export function parseTransactionType(value: string | null): TransactionTypeFilter {
  return value === 'expense' || value === 'income' ? value : 'all';
}

export function parsePositiveInteger(value: string | null): number | undefined {
  if (value === null) {
    return undefined;
  }

  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    return undefined;
  }

  return parsedValue;
}

export function parseDateParam(value: string | null): string | undefined {
  return value !== null && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? value
    : undefined;
}

export function getSelectedPresetKey(
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

export function setOptionalSearchParam(
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
