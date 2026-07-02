import { pool } from '@finance/db';
import type { ExpenseAccount } from '@finance/shared';
import type { FastifyInstance } from 'fastify';
import {
  buildCockpitSubjectDetail,
  buildCockpitSubjectSummaries,
  isCockpitSubjectSlug,
  type CockpitTransactionRow,
} from '../cockpit/subjectAnalysis.js';
import { reportQuerySchema, toReportQuery, type ReportQuery } from '../lib/query-params.js';
import { formatDateKey } from '../payment-reminders/date.js';
import { getPaymentReminderRows } from '../payment-reminders/repository.js';
import type { PaymentReminderRow } from '../payment-reminders/types.js';

export type CockpitSubjectQuery = Pick<ReportQuery, 'account' | 'from' | 'to'>;

type CockpitSubjectParams = {
  slug: string;
};

type CockpitRoutesOptions = {
  fetchReminders?: (account?: ExpenseAccount) => Promise<PaymentReminderRow[]>;
  fetchTransactions?: (
    query: CockpitSubjectQuery,
  ) => Promise<CockpitTransactionRow[]>;
  today?: () => string;
};

export async function registerCockpitRoutes(
  app: FastifyInstance,
  options: CockpitRoutesOptions = {},
): Promise<void> {
  const fetchTransactions = options.fetchTransactions ?? fetchCockpitTransactions;
  const fetchReminders = options.fetchReminders ?? getPaymentReminderRows;
  const getToday = options.today ?? (() => formatDateKey(new Date()));

  app.get<{ Querystring: CockpitSubjectQuery }>(
    '/subjects',
    {
      schema: {
        querystring: reportQuerySchema(),
      },
    },
    async (request) => {
      const query = toReportQuery(request.query);
      const [transactions, reminders] = await Promise.all([
        fetchTransactions(query),
        fetchReminders(query.account),
      ]);

      return {
        subjects: buildCockpitSubjectSummaries({
          from: query.from,
          reminders,
          to: query.to,
          today: getToday(),
          transactions,
        }),
      };
    },
  );

  app.get<{ Params: CockpitSubjectParams; Querystring: CockpitSubjectQuery }>(
    '/subjects/:slug',
    {
      schema: {
        params: cockpitSubjectParamsSchema(),
        querystring: reportQuerySchema(),
      },
    },
    async (request) => {
      const slug = request.params.slug;

      if (!isCockpitSubjectSlug(slug)) {
        throw Object.assign(new Error('Cockpit subject not found'), {
          statusCode: 404,
        });
      }

      const query = toReportQuery(request.query);
      const [transactions, reminders] = await Promise.all([
        fetchTransactions(query),
        fetchReminders(query.account),
      ]);

      return {
        subject: buildCockpitSubjectDetail(slug, {
          from: query.from,
          reminders,
          to: query.to,
          today: getToday(),
          transactions,
        }),
      };
    },
  );
}

async function fetchCockpitTransactions(
  query: CockpitSubjectQuery,
): Promise<CockpitTransactionRow[]> {
  const values: Array<ExpenseAccount | string> = [];
  const filters: string[] = [];

  if (query.account !== undefined) {
    values.push(query.account);
    filters.push(`account = $${values.length}`);
  }

  if (query.from !== undefined) {
    values.push(query.from);
    filters.push(`date >= $${values.length}`);
  }

  if (query.to !== undefined) {
    values.push(query.to);
    filters.push(`date <= $${values.length}`);
  }

  const whereClause =
    filters.length > 0 ? `where ${filters.join(' and ')}` : '';
  const result = await pool.query<CockpitTransactionRow>(
    `
      with transactions as (
        select
          expenses.id,
          expenses.date,
          expenses.amount::numeric(12, 2)::text as amount,
          expenses.description,
          expenses.bank_concept,
          expenses.category_id,
          categories.name as category,
          expenses.subcategory_id,
          subcategories.name as subcategory,
          expenses.account,
          'expense' as type
        from expenses
        join categories on categories.id = expenses.category_id
        left join subcategories on subcategories.id = expenses.subcategory_id

        union all

        select
          income.id,
          income.date,
          income.amount::numeric(12, 2)::text as amount,
          income.description,
          income.bank_concept,
          income.category_id,
          categories.name as category,
          income.subcategory_id,
          subcategories.name as subcategory,
          income.account,
          'income' as type
        from income
        join categories on categories.id = income.category_id
        left join subcategories on subcategories.id = income.subcategory_id
      )
      select
        id,
        to_char(date, 'YYYY-MM-DD') as date,
        amount,
        description,
        bank_concept,
        category_id,
        category,
        subcategory_id,
        subcategory,
        account,
        type
      from transactions
      ${whereClause}
      order by date desc, coalesce(description, '');
    `,
    values,
  );

  return result.rows;
}

function cockpitSubjectParamsSchema(): object {
  return {
    type: 'object',
    additionalProperties: false,
    required: ['slug'],
    properties: {
      slug: { type: 'string', minLength: 1 },
    },
  };
}
