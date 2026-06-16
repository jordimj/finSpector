import { fetchJson } from '../lib/api';
import type {
  CategorySpend,
  CategorySpendResponse,
  DateRange,
  ExpenseTransaction,
  ExpenseTransactionsResponse,
  LastMonthExpensePoint,
  LastMonthExpenses,
  RecentTransaction,
  RecentTransactionsResponse,
  ReportDateRange,
} from '../types';

const lastMonthExpensePageSize = 500;
const recentTransactionLimit = 10;

export async function fetchLastMonthExpenses(
  range: DateRange,
): Promise<LastMonthExpenses> {
  const transactions: ExpenseTransaction[] = [];
  let offset = 0;

  while (true) {
    const params = new URLSearchParams({
      type: 'expense',
      from: range.startDate,
      to: range.endDate,
      limit: String(lastMonthExpensePageSize),
      offset: String(offset),
    });

    const response = await fetchJson<ExpenseTransactionsResponse>({
      path: `/api/transactions?${params.toString()}`,
    });

    transactions.push(...response.transactions);

    if (response.transactions.length < lastMonthExpensePageSize) {
      break;
    }

    offset += lastMonthExpensePageSize;
  }

  const dailyExpenses = buildDailyExpenses(
    range.startDate,
    range.endDate,
    transactions,
  );

  return {
    ...range,
    dailyExpenses,
    total: dailyExpenses.reduce((sum, point) => sum + point.amount, 0),
  };
}

export async function fetchCategorySpend(
  range: ReportDateRange,
): Promise<CategorySpend> {
  const params = new URLSearchParams();

  if (range.startDate !== undefined) {
    params.set('from', range.startDate);
  }

  if (range.endDate !== undefined) {
    params.set('to', range.endDate);
  }

  const queryString = params.toString();

  const response = await fetchJson<CategorySpendResponse>({
    path: `/api/reports/category-spend${queryString ? `?${queryString}` : ''}`,
  });
  const total = response.categories.reduce(
    (sum, category) => sum + Number(category.total),
    0,
  );

  return {
    ...range,
    categories: response.categories.map((category) => {
      const totalAmount = Number(category.total);

      return {
        ...category,
        share: total > 0 ? totalAmount / total : 0,
        totalAmount,
      };
    }),
    total,
  };
}

export function fetchRecentTransactions(): Promise<RecentTransactionsResponse> {
  const params = new URLSearchParams({
    limit: String(recentTransactionLimit),
    offset: '0',
  });

  return fetchJson<RecentTransactionsResponse>({
    path: `/api/transactions?${params.toString()}`,
  });
}

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

export function buildDailyExpenses(
  startDate: string,
  endDate: string,
  transactions: ExpenseTransaction[],
): LastMonthExpensePoint[] {
  const totalsByDate = new Map<string, number>();

  for (const transaction of transactions) {
    totalsByDate.set(
      transaction.date,
      (totalsByDate.get(transaction.date) ?? 0) + Number(transaction.amount),
    );
  }

  const points: LastMonthExpensePoint[] = [];
  const date = parseDateKey(startDate);
  const end = parseDateKey(endDate);

  while (date <= end) {
    const key = formatDateKey(date);

    points.push({
      date: key,
      label: formatDayLabel(date),
      amount: totalsByDate.get(key) ?? 0,
    });

    date.setDate(date.getDate() + 1);
  }

  return points;
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

export function formatDateRange(startDate: string, endDate: string): string {
  const formatter = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  });

  return `${formatter.format(parseDateKey(startDate))} - ${formatter.format(
    parseDateKey(endDate),
  )}`;
}

export function formatReportDateRange(range: ReportDateRange): string {
  if (range.startDate === undefined && range.endDate === undefined) {
    return 'All time';
  }

  if (range.startDate !== undefined && range.endDate !== undefined) {
    return formatDateRange(range.startDate, range.endDate);
  }

  if (range.startDate !== undefined) {
    return `Since ${formatTransactionDate(range.startDate)}`;
  }

  if (range.endDate !== undefined) {
    return `Through ${formatTransactionDate(range.endDate)}`;
  }

  return 'All time';
}

export function formatTransactionDate(date: string): string {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(parseDateKey(date));
}

export function formatTransactionAmount(
  transaction: RecentTransaction,
): string {
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
