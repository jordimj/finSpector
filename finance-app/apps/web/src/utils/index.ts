import type { Transaction } from '@finance/shared';
import type { AccountFilter, DateRange, ReportDateRange } from '../types';

export function getLastMonthRange(now = new Date()): DateRange {
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 0);

  return {
    startDate: formatDateKey(start),
    endDate: formatDateKey(end),
  };
}

export function getCurrentMonthRange(now = new Date()): DateRange {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);

  return {
    startDate: formatDateKey(start),
    endDate: formatDateKey(now),
  };
}

export function getLastSixMonthsRange(now = new Date()): DateRange {
  const start = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  return {
    startDate: formatDateKey(start),
    endDate: formatDateKey(now),
  };
}

export function getCurrentYearRange(now = new Date()): DateRange {
  const start = new Date(now.getFullYear(), 0, 1);

  return {
    startDate: formatDateKey(start),
    endDate: formatDateKey(now),
  };
}

export function getLastYearRange(now = new Date()): DateRange {
  const start = new Date(now.getFullYear() - 1, 0, 1);
  const end = new Date(now.getFullYear() - 1, 11, 31);

  return {
    startDate: formatDateKey(start),
    endDate: formatDateKey(end),
  };
}

export function getAllTimeRange(): ReportDateRange {
  return {};
}

export function parseDateKey(value: string): Date {
  const [year = 0, month = 1, day = 1] = value.split('-').map(Number);

  return new Date(year, month - 1, day);
}

export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function formatDayLabel(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(date);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatCompactCurrency(value: number): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'EUR',
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

export function formatPercentage(value: number): string {
  return new Intl.NumberFormat(undefined, {
    style: 'percent',
    maximumFractionDigits: 0,
  }).format(value);
}

type DateFormatOptions = {
  includeYear?: boolean;
};

export function formatDateRange(
  startDate: string,
  endDate: string,
  options: DateFormatOptions = {},
): string {
  const formatter = new Intl.DateTimeFormat(undefined, {
    ...(options.includeYear ? { year: 'numeric' } : {}),
    month: 'short',
    day: 'numeric',
  });

  return `${formatter.format(parseDateKey(startDate))} - ${formatter.format(
    parseDateKey(endDate),
  )}`;
}

export function formatReportDateRange(
  range: ReportDateRange,
  options: DateFormatOptions = {},
): string {
  if (range.startDate === undefined && range.endDate === undefined) {
    return 'All time';
  }

  if (range.startDate !== undefined && range.endDate !== undefined) {
    return formatDateRange(range.startDate, range.endDate, options);
  }

  if (range.startDate !== undefined) {
    return `Since ${formatTransactionDate(range.startDate, options)}`;
  }

  if (range.endDate !== undefined) {
    return `Through ${formatTransactionDate(range.endDate, options)}`;
  }

  return 'All time';
}

export function formatTransactionDate(
  date: string,
  options: DateFormatOptions = {},
): string {
  return new Intl.DateTimeFormat(undefined, {
    ...(options.includeYear ? { year: 'numeric' } : {}),
    month: 'short',
    day: 'numeric',
  }).format(parseDateKey(date));
}

export function formatTransactionAmount(transaction: Transaction): string {
  const amount = Number(transaction.amount);
  const prefix = transaction.type === 'income' ? '+' : '-';

  return `${prefix}${formatTransactionCurrency(amount)}`;
}

export function formatTransactionCurrency(value: number): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function toReportQueryString(
  range: ReportDateRange,
  account: AccountFilter,
  categoryId?: number,
) {
  const params = new URLSearchParams();
  appendAccountParam(params, account);

  if (categoryId !== undefined) {
    params.set('categoryId', String(categoryId));
  }

  if (range.startDate !== undefined) {
    params.set('from', range.startDate);
  }

  if (range.endDate !== undefined) {
    params.set('to', range.endDate);
  }

  return params.toString();
}

export function appendAccountParam(
  params: URLSearchParams,
  account: AccountFilter,
) {
  if (account !== null) {
    params.set('account', account);
  }
}
