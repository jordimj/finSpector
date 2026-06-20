import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { fetchJson } from '../lib/api';
import { appendAccountParam, formatDateKey } from '../utils';
import { useAccountFilter } from './useAccountFilter';
import { useCategories, type Category } from './useCategories';
import type { IncomeVsExpenses } from './useIncomeVsExpenses';

export type ProjectionExpenseExclusion = {
  categoryName: string;
  subcategoryName?: string;
  id: number | null;
  missing: boolean;
};

type ProjectionWindow = {
  startMonth: string;
  endMonth: string;
};

type ProjectionResponseMonth = {
  month: string;
  income: string;
  expenses: string;
  net: string;
};

export type ProjectionIncomeSource = {
  name: string;
  latestAmount: string;
  latestDate: string | null;
  appliedMonthCount: number;
  total: string;
  missing: boolean;
};

type ProjectionResponse = {
  history: ProjectionWindow;
  projection: ProjectionWindow;
  totals: {
    income: string;
    expenses: string;
    net: string;
    savingsRate: number | null;
  };
  months: ProjectionResponseMonth[];
  incomeSources: ProjectionIncomeSource[];
};

export type ProjectionMonth = ProjectionResponseMonth & {
  label: string;
  incomeAmount: number;
  expensesAmount: number;
  netAmount: number;
};

export type Projection = Omit<ProjectionResponse, 'months'> & {
  chartData: IncomeVsExpenses;
  exclusions: ProjectionExpenseExclusion[];
  hasMissingConfiguration: boolean;
  missingExclusions: ProjectionExpenseExclusion[];
  months: ProjectionMonth[];
};

export const projectionDefaultExpenseExclusions = [
  {
    categoryName: 'PIS',
    subcategoryName: 'Amortització',
  },
  {
    categoryName: 'PIS',
    subcategoryName: 'Hipoteca',
  },
  {
    categoryName: 'Cotxe',
    subcategoryName: 'Compra',
  },
  {
    categoryName: 'Transfe compte conjunt',
  },
  {
    categoryName: 'Transfe compte Nil',
  },
] as const;

export function useProjection() {
  const { selectedAccount } = useAccountFilter();
  const categoriesQuery = useCategories();
  const exclusions = useMemo(
    () => resolveProjectionExclusions(categoriesQuery.data ?? []),
    [categoriesQuery.data],
  );
  const excludeCategoryIds = exclusions.flatMap((exclusion) =>
    exclusion.subcategoryName === undefined && exclusion.id !== null
      ? [exclusion.id]
      : [],
  );
  const excludeSubcategoryIds = exclusions.flatMap((exclusion) =>
    exclusion.subcategoryName !== undefined && exclusion.id !== null
      ? [exclusion.id]
      : [],
  );
  const projectionQuery = useQuery({
    queryKey: [
      'reports',
      'projection',
      selectedAccount,
      excludeCategoryIds,
      excludeSubcategoryIds,
    ],
    enabled: categoriesQuery.isSuccess,
    queryFn: async () => {
      const params = new URLSearchParams();
      appendAccountParam(params, selectedAccount);

      if (excludeCategoryIds.length > 0) {
        params.set('excludeCategoryIds', excludeCategoryIds.join(','));
      }

      if (excludeSubcategoryIds.length > 0) {
        params.set('excludeSubcategoryIds', excludeSubcategoryIds.join(','));
      }

      const queryString = params.toString();
      const response = await fetchJson<ProjectionResponse>({
        path: `/api/reports/projection${queryString ? `?${queryString}` : ''}`,
      });

      return toProjection(response, exclusions);
    },
  });

  return {
    ...projectionQuery,
    data: projectionQuery.data,
    error: categoriesQuery.error ?? projectionQuery.error,
    isError: categoriesQuery.isError || projectionQuery.isError,
    isLoading:
      categoriesQuery.isLoading ||
      (categoriesQuery.isSuccess && projectionQuery.isLoading),
  };
}

function resolveProjectionExclusions(
  categories: Category[],
): ProjectionExpenseExclusion[] {
  return projectionDefaultExpenseExclusions.map((target) => {
    const categoryName = normalizeTaxonomyName(target.categoryName);
    const category = categories.find(
      (item) => normalizeTaxonomyName(item.name) === categoryName,
    );

    if (!('subcategoryName' in target)) {
      return {
        ...target,
        id: category?.id ?? null,
        missing: category === undefined,
      };
    }

    const subcategoryName = normalizeTaxonomyName(target.subcategoryName);
    const subcategory = category?.subcategories.find(
      (item) => normalizeTaxonomyName(item.name) === subcategoryName,
    );

    return {
      ...target,
      id: subcategory?.id ?? null,
      missing: subcategory === undefined,
    };
  });
}

function normalizeTaxonomyName(value: string): string {
  return value.toLocaleLowerCase();
}

function toProjection(
  response: ProjectionResponse,
  exclusions: ProjectionExpenseExclusion[],
): Projection {
  const months = response.months.map((month) => ({
    ...month,
    label: formatProjectionMonth(month.month),
    incomeAmount: Number(month.income),
    expensesAmount: Number(month.expenses),
    netAmount: Number(month.net),
  }));
  const chartData: IncomeVsExpenses = {
    groupBy: 'month',
    startDate: toMonthStartDate(response.projection.startMonth),
    endDate: toMonthEndDate(response.projection.endMonth),
    totals: {
      income: response.totals.income,
      expenses: response.totals.expenses,
      net: response.totals.net,
    },
    periods: months.map((month) => ({
      period: month.month,
      label: month.label,
      income: month.income,
      expenses: month.expenses,
      net: month.net,
      incomeAmount: month.incomeAmount,
      expensesAmount: month.expensesAmount,
      netAmount: month.netAmount,
    })),
  };
  const missingExclusions = exclusions.filter((exclusion) => exclusion.missing);

  return {
    ...response,
    chartData,
    exclusions,
    hasMissingConfiguration:
      missingExclusions.length > 0 ||
      response.incomeSources.some((source) => source.missing),
    missingExclusions,
    months,
  };
}

function toMonthStartDate(month: string): string {
  return `${month}-01`;
}

function toMonthEndDate(month: string): string {
  const [year = 0, monthNumber = 1] = month.split('-').map(Number);

  return formatDateKey(new Date(year, monthNumber, 0));
}

function formatProjectionMonth(month: string): string {
  const [year = 0, monthNumber = 1] = month.split('-').map(Number);

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    year: 'numeric',
  }).format(new Date(year, monthNumber - 1, 1));
}
