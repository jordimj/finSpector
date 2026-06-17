import { useQuery } from '@tanstack/react-query';
import { fetchJson } from '../lib/api';
import type { AccountFilter, DateRange } from '../types';
import {
  appendAccountParam,
  formatDateKey,
  formatDayLabel,
  getLastMonthRange,
  parseDateKey,
} from '../utils';
import { useAccountFilter } from './useAccountFilter';

const lastMonthExpensePageSize = 500;

export type LastMonthExpensePoint = {
  date: string;
  label: string;
  amount: number;
};

export type LastMonthExpenses = DateRange & {
  total: number;
  dailyExpenses: LastMonthExpensePoint[];
};

type ExpenseTransaction = {
  date: string;
  amount: string;
  type: 'expense';
};

type ExpenseTransactionsResponse = {
  transactions: ExpenseTransaction[];
  limit: number;
  offset: number;
};

export function useLastMonthExpenses() {
  const { selectedAccount } = useAccountFilter();
  const range = getLastMonthRange();

  return useQuery({
    queryKey: [
      'expenses',
      'last-month',
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
