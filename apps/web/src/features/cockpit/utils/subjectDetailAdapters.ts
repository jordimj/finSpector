import type {
  CockpitBreakdownItem,
  CockpitCashflowPeriod,
  CockpitSubjectDetail,
  TransactionType,
} from '@finance/shared';
import type { CategorySpend } from '../../../hooks/useCategorySpend';
import type { IncomeVsExpenses } from '../../../hooks/useIncomeVsExpenses';
import type { ReportDateRange } from '../../../types';

export type CategorySpendResult = {
  items: CategorySpend[];
  total: number;
};

export function toIncomeVsExpenses(
  subject: CockpitSubjectDetail,
  dateRange: ReportDateRange,
): IncomeVsExpenses {
  return {
    ...dateRange,
    groupBy: 'month',
    periods: subject.monthlyCashflow.map(toIncomeVsExpensesPeriod),
    totals: subject.totals,
  };
}

function toIncomeVsExpensesPeriod(period: CockpitCashflowPeriod) {
  return {
    ...period,
    expensesAmount: Number(period.expenses),
    incomeAmount: Number(period.income),
    label: formatMonthLabel(period.period),
    netAmount: Number(period.net),
  };
}

function formatMonthLabel(period: string): string {
  const [year = 0, month = 1] = period.split('-').map(Number);

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    year: 'numeric',
  }).format(new Date(year, month - 1, 1));
}

export function toCategorySpend(
  breakdown: CockpitBreakdownItem[],
  type: TransactionType,
): CategorySpendResult {
  const matchingBreakdown = breakdown.filter((item) => item.type === type);
  const total = matchingBreakdown.reduce(
    (sum, item) => sum + Number(item.total),
    0,
  );

  return {
    items: matchingBreakdown.map((item) => {
      const totalAmount = Number(item.total);

      return {
        category:
          item.subcategory === null
            ? item.category
            : `${item.category} / ${item.subcategory}`,
        id: item.subcategoryId ?? item.categoryId,
        share: total > 0 ? totalAmount / total : 0,
        total: item.total,
        totalAmount,
        transactionCount: item.transactionCount,
      };
    }),
    total,
  };
}

export function toSubcategorySpend(
  breakdown: CockpitBreakdownItem[],
  type: TransactionType,
): CategorySpendResult {
  const grouped = new Map<
    string,
    {
      category: string;
      id: number | null;
      totalAmount: number;
      transactionCount: number;
    }
  >();

  for (const item of breakdown) {
    if (item.type !== type) {
      continue;
    }

    const category = item.subcategory ?? item.category;
    const key = normalizeBreakdownLabel(category);
    const current = grouped.get(key) ?? {
      category,
      id: item.subcategoryId ?? item.categoryId,
      totalAmount: 0,
      transactionCount: 0,
    };

    grouped.set(key, {
      ...current,
      totalAmount: current.totalAmount + Number(item.total),
      transactionCount: current.transactionCount + item.transactionCount,
    });
  }

  const rows = Array.from(grouped.values()).sort(
    (left, right) => right.totalAmount - left.totalAmount,
  );
  const total = rows.reduce((sum, row) => sum + row.totalAmount, 0);

  return {
    items: rows.map((row) => ({
      category: row.category,
      id: row.id,
      share: total > 0 ? row.totalAmount / total : 0,
      total: row.totalAmount.toFixed(2),
      totalAmount: row.totalAmount,
      transactionCount: row.transactionCount,
    })),
    total,
  };
}

function normalizeBreakdownLabel(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}
