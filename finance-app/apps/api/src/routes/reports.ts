import { pool } from '@finance/db';
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

type CategorySpendRow = {
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
            select date_trunc('month', date)::date as month, amount, 'expense' as type
            from expenses
            ${expenseFilters}

            union all

            select date_trunc('month', date)::date as month, amount, 'income' as type
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
    '/category-spend',
    {
      schema: {
        querystring: reportQuerySchema(),
      },
    },
    async (request) => {
      const query = toReportQuery(request.query);
      const { expenseFilters, values } = buildReportFilters(query);

      const result = await pool.query<CategorySpendRow>(
        `
          select
            categories.name as category,
            count(expenses.id)::text as transaction_count,
            coalesce(sum(expenses.amount), 0)::numeric(12, 2)::text as total
          from expenses
          join categories on categories.id = expenses.category_id
          ${expenseFilters}
          group by categories.name
          order by coalesce(sum(expenses.amount), 0) desc;
        `,
        values,
      );

      return {
        categories: result.rows.map((row) => ({
          category: row.category,
          transactionCount: Number(row.transaction_count),
          total: row.total,
        })),
      };
    },
  );
}

function buildReportFilters(query: ReportQuery): {
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

  return {
    expenseFilters:
      expenseFilters.length > 0 ? `where ${expenseFilters.join(' and ')}` : '',
    incomeFilters:
      incomeFilters.length > 0 ? `where ${incomeFilters.join(' and ')}` : '',
    values,
  };
}
