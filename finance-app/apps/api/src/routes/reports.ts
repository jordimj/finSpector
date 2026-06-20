import { pool } from '@finance/db';
import { PERSONAL_HALF_SHARE_ACCOUNTS } from '@finance/shared';
import type { FastifyInstance } from 'fastify';
import {
  reportQuerySchema,
  toProjectionQuery,
  toReportQuery,
  type ProjectionQuery,
  type ReportQuery,
} from '../lib/query-params.js';

type MonthlyCashflowRow = {
  month: string;
  income: string;
  expenses: string;
  net: string;
};

type IncomeVsExpensesGroupBy = 'month' | 'year';

type IncomeVsExpensesGrouping = {
  groupBy: IncomeVsExpensesGroupBy;
  sqlDatePart: IncomeVsExpensesGroupBy;
  sqlPeriodFormat: 'YYYY-MM' | 'YYYY';
};

type IncomeVsExpensesRow = {
  period: string | null;
  income: string;
  expenses: string;
  net: string;
  is_total: number;
};

type CategorySpendRow = {
  category_id: number | null;
  category: string;
  transaction_count: string;
  total: string;
};

type ProjectionWindowRow = {
  history_start_month: string;
  history_end_month: string;
  projection_start_month: string;
  projection_end_month: string;
};

type ProjectionExpenseRow = {
  month: string;
  expenses: string;
};

type ProjectionIncomeRow = {
  source: string;
  latest_amount: string;
  latest_date: string;
};

type ProjectionQueryValue = string | number | number[] | string[] | null;

type ProjectionIncomeRule = {
  categoryName: string;
  name: string;
  excludedMonthNumbers: readonly number[];
  subcategoryName?: string;
};

const projectionIncomeRules: readonly ProjectionIncomeRule[] = [
  {
    categoryName: 'Salari',
    name: 'Salari',
    excludedMonthNumbers: [],
  },
  {
    categoryName: 'Lloguer',
    name: 'Lloguer / Pis',
    excludedMonthNumbers: [],
    subcategoryName: 'Pis',
  },
  {
    categoryName: 'Lloguer',
    name: 'Lloguer / Parking',
    excludedMonthNumbers: [],
    subcategoryName: 'Parking',
  },
  {
    categoryName: 'Ajuda estat',
    name: 'Ajuda estat',
    excludedMonthNumbers: [],
  },
  {
    categoryName: 'Transfe papes',
    name: 'Transfe papes',
    excludedMonthNumbers: [7, 8],
  },
];

export async function registerReportRoutes(
  app: FastifyInstance,
): Promise<void> {
  app.get<{ Querystring: ReportQuery }>(
    '/monthly-cashflow',
    {
      schema: {
        querystring: reportQuerySchema(),
      },
    },
    async (request) => {
      const query = toReportQuery(request.query);
      const { expenseFilters, incomeFilters, values } =
        buildReportFilters(query);

      const result = await pool.query<MonthlyCashflowRow>(
        `
          with transactions as (
            select
              date_trunc('month', date)::date as month,
              ${personalAmountSql('expenses')} as amount,
              'expense' as type
            from expenses
            ${expenseFilters}

            union all

            select
              date_trunc('month', date)::date as month,
              ${personalAmountSql('income')} as amount,
              'income' as type
            from income
            ${incomeFilters}
          )
          select
            to_char(month, 'YYYY-MM') as month,
            coalesce(sum(amount) filter (where type = 'income'), 0)::numeric(12, 2)::text as income,
            coalesce(sum(amount) filter (where type = 'expense'), 0)::numeric(12, 2)::text as expenses,
            (
              coalesce(sum(amount) filter (where type = 'income'), 0) -
              coalesce(sum(amount) filter (where type = 'expense'), 0)
            )::numeric(12, 2)::text as net
          from transactions
          group by month
          order by month;
        `,
        values,
      );

      return {
        months: result.rows,
      };
    },
  );

  app.get<{ Querystring: ReportQuery }>(
    '/income-vs-expenses',
    {
      schema: {
        querystring: reportQuerySchema({ includeCategoryId: true }),
      },
    },
    async (request) => {
      const query = toReportQuery(request.query);
      const { expenseFilters, incomeFilters, values } = buildReportFilters(
        query,
        { filterExpensesByCategory: true },
      );
      const grouping = getIncomeVsExpensesGrouping(query);

      const result = await pool.query<IncomeVsExpensesRow>(
        `
          with transactions as (
            select
              date_trunc('${grouping.sqlDatePart}', date)::date as period_start,
              ${personalAmountSql('expenses')} as amount,
              'expense' as type
            from expenses
            ${expenseFilters}

            union all

            select
              date_trunc('${grouping.sqlDatePart}', date)::date as period_start,
              ${personalAmountSql('income')} as amount,
              'income' as type
            from income
            ${incomeFilters}
          )
          select
            case
              when grouping(period_start) = 1 then null
              else to_char(period_start, '${grouping.sqlPeriodFormat}')
            end as period,
            coalesce(sum(amount) filter (where type = 'income'), 0)::numeric(12, 2)::text as income,
            coalesce(sum(amount) filter (where type = 'expense'), 0)::numeric(12, 2)::text as expenses,
            (
              coalesce(sum(amount) filter (where type = 'income'), 0) -
              coalesce(sum(amount) filter (where type = 'expense'), 0)
            )::numeric(12, 2)::text as net,
            grouping(period_start)::integer as is_total
          from transactions
          group by rollup(period_start)
          order by grouping(period_start), period_start;
        `,
        values,
      );
      const total = result.rows.find((row) => row.is_total === 1);

      return {
        groupBy: grouping.groupBy,
        totals: toIncomeVsExpensesAmounts(total),
        periods: result.rows.flatMap((row) => {
          if (row.is_total === 1 || row.period === null) {
            return [];
          }

          return [
            {
              period: row.period,
              ...toIncomeVsExpensesAmounts(row),
            },
          ];
        }),
      };
    },
  );

  app.get<{ Querystring: ReportQuery }>(
    '/category-spend',
    {
      schema: {
        querystring: reportQuerySchema({
          includeCategoryId: true,
          includeTransactionType: true,
        }),
      },
    },
    async (request) => {
      const query = toReportQuery(request.query);
      const { expenseFilters, incomeFilters, values } =
        buildReportFilters(query);
      const id = query.categoryId;
      const transactionType = query.type ?? 'expense';

      const result =
        id === undefined
          ? transactionType === 'income'
            ? await pool.query<CategorySpendRow>(
                `
                  select
                    categories.id as category_id,
                    categories.name as category,
                    count(income.id)::text as transaction_count,
                    coalesce(sum(${personalAmountSql('income')}), 0)::numeric(12, 2)::text as total
                  from income
                  join categories on categories.id = income.category_id
                  ${incomeFilters}
                  group by categories.id, categories.name
                  order by coalesce(sum(${personalAmountSql('income')}), 0) desc;
                `,
                values,
              )
            : await pool.query<CategorySpendRow>(
                `
                  select
                    categories.id as category_id,
                    categories.name as category,
                    count(expenses.id)::text as transaction_count,
                    coalesce(sum(${personalAmountSql('expenses')}), 0)::numeric(12, 2)::text as total
                  from expenses
                  join categories on categories.id = expenses.category_id
                  ${expenseFilters}
                  group by categories.id, categories.name
                  order by coalesce(sum(${personalAmountSql('expenses')}), 0) desc;
                `,
                values,
              )
          : transactionType === 'income'
            ? await pool.query<CategorySpendRow>(
                `
                  select
                    subcategories.id as category_id,
                    coalesce(subcategories.name, 'Uncategorized') as category,
                    count(income.id)::text as transaction_count,
                    coalesce(sum(${personalAmountSql('income')}), 0)::numeric(12, 2)::text as total
                  from income
                  left join subcategories on subcategories.id = income.subcategory_id
                  ${appendReportFilter(
                    incomeFilters,
                    values,
                    'income.category_id',
                    id,
                  )}
                  group by subcategories.id, coalesce(subcategories.name, 'Uncategorized')
                  order by coalesce(sum(${personalAmountSql('income')}), 0) desc;
                `,
                values,
              )
            : await pool.query<CategorySpendRow>(
                `
                  select
                    subcategories.id as category_id,
                    coalesce(subcategories.name, 'Uncategorized') as category,
                    count(expenses.id)::text as transaction_count,
                    coalesce(sum(${personalAmountSql('expenses')}), 0)::numeric(12, 2)::text as total
                  from expenses
                  left join subcategories on subcategories.id = expenses.subcategory_id
                  ${appendReportFilter(
                    expenseFilters,
                    values,
                    'expenses.category_id',
                    id,
                  )}
                  group by subcategories.id, coalesce(subcategories.name, 'Uncategorized')
                  order by coalesce(sum(${personalAmountSql('expenses')}), 0) desc;
                `,
                values,
              );

      return result.rows.map((row) => ({
        id: row.category_id,
        category: row.category,
        transactionCount: Number(row.transaction_count),
        total: row.total,
      }));
    },
  );

  app.get<{ Querystring: ProjectionQuery }>(
    '/projection',
    {
      schema: {
        querystring: reportQuerySchema({
          includeExcludeCategoryIds: true,
          includeExcludeSubcategoryIds: true,
        }),
      },
    },
    async (request) => {
      const query = toProjectionQuery(request.query);
      const [windowResult, expenseRows, incomeRows] = await Promise.all([
        getProjectionWindow(),
        getProjectedExpenses(query),
        getProjectionIncomeSources(query),
      ]);
      const window = windowResult.rows[0];

      if (window === undefined) {
        throw new Error('Unable to build projection window');
      }

      return buildProjectionResponse(window, expenseRows.rows, incomeRows.rows);
    },
  );
}

function getProjectionWindow() {
  return pool.query<ProjectionWindowRow>(`
    select
      to_char(date_trunc('month', current_date) - interval '12 months', 'YYYY-MM') as history_start_month,
      to_char(date_trunc('month', current_date) - interval '1 month', 'YYYY-MM') as history_end_month,
      to_char(date_trunc('month', current_date), 'YYYY-MM') as projection_start_month,
      to_char(date_trunc('month', current_date) + interval '11 months', 'YYYY-MM') as projection_end_month;
  `);
}

function getProjectedExpenses(query: {
  account?: string;
  excludeCategoryIds: number[];
  excludeSubcategoryIds: number[];
}) {
  const values: ProjectionQueryValue[] = [];
  const filters = [
    'expenses.date >= bounds.history_start',
    'expenses.date < bounds.projection_start',
  ];

  if (query.account) {
    values.push(query.account);
    filters.push(`expenses.account = $${values.length}`);
  }

  if (query.excludeCategoryIds.length > 0) {
    values.push(query.excludeCategoryIds);
    filters.push(`expenses.category_id <> all($${values.length}::int[])`);
  }

  if (query.excludeSubcategoryIds.length > 0) {
    values.push(query.excludeSubcategoryIds);
    filters.push(
      `(expenses.subcategory_id is null or expenses.subcategory_id <> all($${values.length}::int[]))`,
    );
  }

  return pool.query<ProjectionExpenseRow>(
    `
      with bounds as (
        select
          (date_trunc('month', current_date) - interval '12 months')::date as history_start,
          date_trunc('month', current_date)::date as projection_start
      ),
      projection_months as (
        select generate_series(
          bounds.projection_start,
          bounds.projection_start + interval '11 months',
          interval '1 month'
        )::date as month
        from bounds
      ),
      historical_expenses as (
        select
          date_trunc('month', expenses.date)::date as historical_month,
          coalesce(sum(${personalAmountSql('expenses')}), 0) as expenses
        from expenses
        cross join bounds
        where ${filters.join(' and ')}
        group by date_trunc('month', expenses.date)::date
      )
      select
        to_char(projection_months.month, 'YYYY-MM') as month,
        coalesce(historical_expenses.expenses, 0)::numeric(12, 2)::text as expenses
      from projection_months
      left join historical_expenses
        on historical_expenses.historical_month = (projection_months.month - interval '1 year')::date
      order by projection_months.month;
    `,
    values,
  );
}

function getProjectionIncomeSources(query: { account?: string }) {
  const sourceValues = projectionIncomeRules.flatMap((rule) => [
    rule.name,
    rule.categoryName.toLocaleLowerCase(),
    rule.subcategoryName?.toLocaleLowerCase() ?? null,
  ]);
  const sourceValuePlaceholders = projectionIncomeRules
    .map((_, index) => {
      const sourceNameParameter = `$${index * 3 + 1}`;
      const categoryNameParameter = `$${index * 3 + 2}`;
      const subcategoryNameParameter = `$${index * 3 + 3}`;

      return `(${sourceNameParameter}::text, ${categoryNameParameter}::text, ${subcategoryNameParameter}::text)`;
    })
    .join(', ');
  const values: ProjectionQueryValue[] = sourceValues;
  const filters: string[] = [];

  if (query.account) {
    values.push(query.account);
    filters.push(`income.account = $${values.length}`);
  }

  const whereClause =
    filters.length > 0 ? `where ${filters.join(' and ')}` : '';

  return pool.query<ProjectionIncomeRow>(
    `
      with configured_sources(source_name, category_name, subcategory_name) as (
        values ${sourceValuePlaceholders}
      ),
      ranked_income as (
        select
          configured_sources.source_name as source,
          ${personalAmountSql('income')}::numeric(12, 2)::text as latest_amount,
          to_char(income.date, 'YYYY-MM-DD') as latest_date,
          row_number() over (
            partition by configured_sources.source_name
            order by income.date desc, income.created_at desc, income.id desc
          ) as source_rank
        from income
        join categories on categories.id = income.category_id
        left join subcategories on subcategories.id = income.subcategory_id
        join configured_sources
          on lower(categories.name) = configured_sources.category_name
          and (
            configured_sources.subcategory_name is null
            or lower(subcategories.name) = configured_sources.subcategory_name
          )
        ${whereClause}
      )
      select
        source,
        latest_amount,
        latest_date
      from ranked_income
      where source_rank = 1
      order by source;
    `,
    values,
  );
}

function buildProjectionResponse(
  window: ProjectionWindowRow,
  expenseRows: ProjectionExpenseRow[],
  incomeRows: ProjectionIncomeRow[],
) {
  const latestIncomeBySource = new Map(
    incomeRows.map((row) => [row.source, row]),
  );
  const months = expenseRows.map((row) => {
    const income = getProjectedIncomeForMonth(row.month, latestIncomeBySource);
    const expenses = Number(row.expenses);
    const net = income - expenses;

    return {
      month: row.month,
      income: toMoneyText(income),
      expenses: toMoneyText(expenses),
      net: toMoneyText(net),
    };
  });
  const incomeTotal = months.reduce(
    (sum, month) => sum + Number(month.income),
    0,
  );
  const expensesTotal = months.reduce(
    (sum, month) => sum + Number(month.expenses),
    0,
  );
  const netTotal = incomeTotal - expensesTotal;

  return {
    history: {
      startMonth: window.history_start_month,
      endMonth: window.history_end_month,
    },
    projection: {
      startMonth: window.projection_start_month,
      endMonth: window.projection_end_month,
    },
    totals: {
      income: toMoneyText(incomeTotal),
      expenses: toMoneyText(expensesTotal),
      net: toMoneyText(netTotal),
      savingsRate:
        incomeTotal > 0 ? Number((netTotal / incomeTotal).toFixed(4)) : null,
    },
    months,
    incomeSources: projectionIncomeRules.map((rule) => {
      const latestIncome = latestIncomeBySource.get(rule.name);
      const latestAmount = Number(latestIncome?.latest_amount ?? 0);
      const appliedMonthCount = months.filter((month) =>
        isIncomeSourceAppliedToMonth(rule, month.month),
      ).length;

      return {
        name: rule.name,
        latestAmount: toMoneyText(latestAmount),
        latestDate: latestIncome?.latest_date ?? null,
        appliedMonthCount,
        total: toMoneyText(latestAmount * appliedMonthCount),
        missing: latestIncome === undefined,
      };
    }),
  };
}

function getProjectedIncomeForMonth(
  month: string,
  latestIncomeBySource: Map<string, ProjectionIncomeRow>,
): number {
  return projectionIncomeRules.reduce((sum, rule) => {
    if (!isIncomeSourceAppliedToMonth(rule, month)) {
      return sum;
    }

    return (
      sum + Number(latestIncomeBySource.get(rule.name)?.latest_amount ?? 0)
    );
  }, 0);
}

function isIncomeSourceAppliedToMonth(
  rule: ProjectionIncomeRule,
  month: string,
): boolean {
  const monthNumber = Number(month.slice(5, 7));

  return !rule.excludedMonthNumbers.includes(monthNumber);
}

function toMoneyText(value: number): string {
  const rounded = Math.round((value + Number.EPSILON) * 100) / 100;

  if (Object.is(rounded, -0) || rounded === 0) {
    return '0.00';
  }

  return rounded.toFixed(2);
}

function getIncomeVsExpensesGrouping(
  query: ReportQuery,
): IncomeVsExpensesGrouping {
  if (query.from === undefined && query.to === undefined) {
    return {
      groupBy: 'year',
      sqlDatePart: 'year',
      sqlPeriodFormat: 'YYYY',
    };
  }

  return {
    groupBy: 'month',
    sqlDatePart: 'month',
    sqlPeriodFormat: 'YYYY-MM',
  };
}

function toIncomeVsExpensesAmounts(
  row: Pick<IncomeVsExpensesRow, 'income' | 'expenses' | 'net'> | undefined,
) {
  return {
    income: row?.income ?? '0.00',
    expenses: row?.expenses ?? '0.00',
    net: row?.net ?? '0.00',
  };
}

function appendReportFilter(
  existingFilter: string,
  values: Array<string | number>,
  column: string,
  value: string | number,
): string {
  values.push(value);
  const clause = `${column} = $${values.length}`;

  if (!existingFilter) {
    return `where ${clause}`;
  }

  return `${existingFilter} and ${clause}`;
}

const personalHalfShareAccountSqlList = PERSONAL_HALF_SHARE_ACCOUNTS.map(
  (account) => `'${account}'`,
).join(', ');

function personalAmountSql(tableName: 'expenses' | 'income'): string {
  return `case when ${tableName}.account in (${personalHalfShareAccountSqlList}) then ${tableName}.amount / 2 else ${tableName}.amount end`;
}

function buildReportFilters(
  query: ReportQuery,
  options: {
    filterExpensesByCategory?: boolean;
    filterIncomeByCategory?: boolean;
  } = {},
): {
  expenseFilters: string;
  incomeFilters: string;
  values: Array<string | number>;
} {
  const values: Array<string | number> = [];
  const expenseFilters: string[] = [];
  const incomeFilters: string[] = [];

  if (query.account) {
    values.push(query.account);
    expenseFilters.push(`account = $${values.length}`);
    incomeFilters.push(`account = $${values.length}`);
  }

  if (query.from) {
    values.push(query.from);
    expenseFilters.push(`date >= $${values.length}`);
    incomeFilters.push(`date >= $${values.length}`);
  }

  if (query.to) {
    values.push(query.to);
    expenseFilters.push(`date <= $${values.length}`);
    incomeFilters.push(`date <= $${values.length}`);
  }

  if (query.categoryId !== undefined && options.filterExpensesByCategory) {
    values.push(query.categoryId);
    expenseFilters.push(`category_id = $${values.length}`);
  }

  if (query.categoryId !== undefined && options.filterIncomeByCategory) {
    values.push(query.categoryId);
    incomeFilters.push(`category_id = $${values.length}`);
  }

  return {
    expenseFilters:
      expenseFilters.length > 0 ? `where ${expenseFilters.join(' and ')}` : '',
    incomeFilters:
      incomeFilters.length > 0 ? `where ${incomeFilters.join(' and ')}` : '',
    values,
  };
}
