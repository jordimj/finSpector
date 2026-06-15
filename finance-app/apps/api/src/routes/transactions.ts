import { pool } from '@finance/db';
import type { ExpenseAccount } from '@finance/shared';
import type { FastifyInstance } from 'fastify';
import {
  toTransactionQuery,
  transactionQuerySchema,
  type TransactionQuery,
} from '../lib/query-params.js';

type TransactionRow = {
  id: string;
  date: string;
  amount: string;
  name: string;
  original_description: string;
  category: string;
  subcategory: string | null;
  notes: string | null;
  account: ExpenseAccount | null;
  type: 'expense' | 'income';
};

export async function registerTransactionRoutes(
  app: FastifyInstance,
): Promise<void> {
  app.get<{ Querystring: TransactionQuery }>(
    '/',
    {
      schema: {
        querystring: transactionQuerySchema(),
      },
    },
    async (request) => {
      const query = toTransactionQuery(request.query);
      const filters: string[] = [];
      const values: Array<string | number> = [];

      if (query.type !== 'all') {
        values.push(query.type);
        filters.push(`type = $${values.length}`);
      }

      if (query.account) {
        values.push(query.account);
        filters.push(`account = $${values.length}`);
      }

      if (query.from) {
        values.push(query.from);
        filters.push(`date >= $${values.length}`);
      }

      if (query.to) {
        values.push(query.to);
        filters.push(`date <= $${values.length}`);
      }

      if (query.search) {
        values.push(`%${query.search}%`);
        filters.push(
          `(name ilike $${values.length} or original_description ilike $${values.length})`,
        );
      }

      values.push(query.limit);
      const limitParameter = `$${values.length}`;
      values.push(query.offset);
      const offsetParameter = `$${values.length}`;

      const whereClause =
        filters.length > 0 ? `where ${filters.join(' and ')}` : '';

      const result = await pool.query<TransactionRow>(
        `
          with transactions as (
            select
              expenses.id,
              expenses.date,
              expenses.amount,
              expenses.merchant_name as name,
              expenses.original_description,
              categories.name as category,
              subcategories.name as subcategory,
              expenses.notes,
              expenses.account,
              'expense' as type
            from expenses
            join categories on categories.id = expenses.category_id
            left join subcategories on subcategories.id = expenses.subcategory_id

            union all

            select
              income.id,
              income.date,
              income.amount,
              income.payer_name as name,
              income.original_description,
              categories.name as category,
              null as subcategory,
              income.notes,
              null as account,
              'income' as type
            from income
            join categories on categories.id = income.category_id
          )
          select
            id,
            to_char(date, 'YYYY-MM-DD') as date,
            amount::numeric(12, 2)::text as amount,
            name,
            original_description,
            category,
            subcategory,
            notes,
            account,
            type
          from transactions
          ${whereClause}
          order by date desc, name
          limit ${limitParameter}
          offset ${offsetParameter};
        `,
        values,
      );

      return {
        transactions: result.rows.map(toTransactionResponse),
        limit: query.limit,
        offset: query.offset,
      };
    },
  );
}

function toTransactionResponse(row: TransactionRow) {
  return {
    id: row.id,
    date: row.date,
    amount: row.amount,
    name: row.name,
    originalDescription: row.original_description,
    category: row.category,
    subcategory: row.subcategory,
    notes: row.notes,
    account: row.account,
    type: row.type,
  };
}
