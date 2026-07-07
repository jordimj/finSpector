import { useQuery } from '@tanstack/react-query';
import {
  getPersonalTransactionAmount,
  type ExpenseAccount,
} from '@finance/shared';
import { fetchJson } from '../lib/api';
import type { AccountFilter, DateRange } from '../types';
import {
  appendAccountParam,
  formatDateKey,
  formatDayLabel,
  formatMonthLabel,
  getCompletedMonthRange,
  getLastMonthRange,
  parseDateKey,
} from '../utils';
import { useAccountFilter } from './useAccountFilter';

const lastMonthExpensePageSize = 500;

export type LastMonthExpenseRange = '1m' | '6m' | '1y';
export type LastMonthExpenseBucket = 'day' | 'month';

export type LastMonthExpensePoint = {
  date: string;
  label: string;
  amount: number;
};

export type LastMonthExpenses = DateRange & {
  bucket: LastMonthExpenseBucket;
  range: LastMonthExpenseRange;
  total: number;
  dailyExpenses: LastMonthExpensePoint[];
};

const rangeConfigs = {
  '1m': {
    bucket: 'day',
    monthCount: 1,
    queryLabel: 'last-month',
  },
  '6m': {
    bucket: 'month',
    monthCount: 6,
    queryLabel: 'last-six-months',
  },
  '1y': {
    bucket: 'month',
    monthCount: 12,
    queryLabel: 'last-year',
  },
};

type ExpenseTransaction = {
  account: ExpenseAccount | null;
  date: string;
  amount: string;
  type: 'expense';
};

type ExpenseTransactionsResponse = {
  transactions: ExpenseTransaction[];
  limit: number;
  offset: number;
};

export function useLastMonthExpenses(rangeKey: LastMonthExpenseRange = '1m') {
  const { selectedAccount } = useAccountFilter();
  const config = rangeConfigs[rangeKey];
  const range =
    rangeKey === '1m'
      ? getLastMonthRange()
      : getCompletedMonthRange(config.monthCount);

  return useQuery({
    queryKey: [
      'expenses',
      config.queryLabel,
      range.startDate,
      range.endDate,
      selectedAccount,
    ],
    queryFn: async () => {
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
        appendAccountParam(params, selectedAccount);

        const response = await fetchJson<ExpenseTransactionsResponse>({
          path: `/api/transactions?${params.toString()}`,
        });

        transactions.push(...response.transactions);

        if (response.transactions.length < lastMonthExpensePageSize) {
          break;
        }

        offset += lastMonthExpensePageSize;
      }

      const dailyExpenses =
        config.bucket === 'month'
          ? buildMonthlyExpenses(range.startDate, range.endDate, transactions)
          : buildDailyExpenses(range.startDate, range.endDate, transactions);

      return {
        ...range,
        bucket: config.bucket,
        dailyExpenses,
        range: rangeKey,
        total: dailyExpenses.reduce((sum, point) => sum + point.amount, 0),
      };
    },
  });
}

function buildDailyExpenses(
  startDate: string,
  endDate: string,
  transactions: ExpenseTransaction[],
) {
  const totalsByDate = new Map<string, number>();

  for (const transaction of transactions) {
    const amount = getPersonalTransactionAmount(
      Number(transaction.amount),
      transaction.account,
    );

    totalsByDate.set(
      transaction.date,
      (totalsByDate.get(transaction.date) ?? 0) + amount,
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

function buildMonthlyExpenses(
  startDate: string,
  endDate: string,
  transactions: ExpenseTransaction[],
) {
  const totalsByMonth = new Map<string, number>();

  for (const transaction of transactions) {
    const amount = getPersonalTransactionAmount(
      Number(transaction.amount),
      transaction.account,
    );
    const monthKey = transaction.date.slice(0, 7);

    totalsByMonth.set(monthKey, (totalsByMonth.get(monthKey) ?? 0) + amount);
  }

  const points: LastMonthExpensePoint[] = [];
  const date = parseDateKey(startDate);
  const end = parseDateKey(endDate);

  while (date <= end) {
    const key = formatDateKey(date).slice(0, 7);

    points.push({
      date: `${key}-01`,
      label: formatMonthLabel(date),
      amount: totalsByMonth.get(key) ?? 0,
    });

    date.setMonth(date.getMonth() + 1);
  }

  return points;
}
