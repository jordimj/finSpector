import { pool } from '@finance/db';
import { PERSONAL_HALF_SHARE_ACCOUNTS } from '@finance/shared';
import type { FastifyInstance } from 'fastify';
import {
  reportQuerySchema,
  toReportQuery,
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
