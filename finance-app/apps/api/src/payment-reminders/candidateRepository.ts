import { pool } from '@finance/db';
import type { ExpenseAccount } from '@finance/shared';
import { recurringCandidateMonths } from './constants.js';
import type { CandidateExpenseRow } from './types.js';

export async function getCandidateExpenseRows(account?: ExpenseAccount) {
  const values: Array<string | number> = [recurringCandidateMonths];
  const filters = [
    `expenses.date >= current_date - ($1::int * interval '1 month')`,
  ];

  if (account !== undefined) {
    values.push(account);
    filters.push(`expenses.account = $${values.length}`);
  }

  const result = await pool.query<CandidateExpenseRow>(
    `
      select
        expenses.id,
        to_char(expenses.date, 'YYYY-MM-DD') as date,
        expenses.amount::numeric(12, 2)::text as amount,
        expenses.description,
        expenses.bank_concept,
        expenses.account,
        expenses.category_id,
        categories.name as category,
        expenses.subcategory_id,
        subcategories.name as subcategory
      from expenses
      join categories on categories.id = expenses.category_id
      left join subcategories on subcategories.id = expenses.subcategory_id
      where ${filters.join(' and ')}
      order by expenses.date desc;
    `,
    values,
  );

  return result.rows;
}

export async function getDismissedSuggestionKeys(): Promise<Set<string>> {
  const result = await pool.query<{ suggestion_key: string }>(
    'select suggestion_key from payment_reminder_dismissed_suggestions;',
  );

  return new Set(result.rows.map((row) => row.suggestion_key));
}

export async function dismissPaymentReminderSuggestion(key: string) {
  await pool.query(
    `
      insert into payment_reminder_dismissed_suggestions (
        suggestion_key,
        dismissed_at
      )
      values ($1, now())
      on conflict (suggestion_key) do update
      set dismissed_at = excluded.dismissed_at;
    `,
    [key],
  );
}
