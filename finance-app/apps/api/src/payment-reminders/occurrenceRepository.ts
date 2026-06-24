import { pool } from '@finance/db';
import type { ExpenseAccount } from '@finance/shared';
import {
  matchWindowDaysAfter,
  matchWindowDaysBefore,
} from './constants.js';
import {
  isPaymentReminderExpenseMatch,
  occurrenceKey,
} from './occurrences.js';
import type {
  PaymentMatchExpenseRow,
  PaymentOccurrenceOverrideRow,
  PaymentOccurrenceStatus,
} from './types.js';

export async function getOccurrenceOverrides(
  reminderIds: string[],
  startDate: string,
  endDate: string,
): Promise<Map<string, PaymentOccurrenceOverrideRow>> {
  if (reminderIds.length === 0) {
    return new Map();
  }

  const result = await pool.query<PaymentOccurrenceOverrideRow>(
    `
      select
        id,
        payment_reminder_id,
        to_char(due_date, 'YYYY-MM-DD') as due_date,
        status,
        matched_expense_id,
        paid_at::text as paid_at,
        skipped_at::text as skipped_at
      from payment_reminder_occurrences
      where payment_reminder_id = any($1::uuid[])
        and due_date between $2::date and $3::date;
    `,
    [reminderIds, startDate, endDate],
  );

  return new Map(
    result.rows.map((row) => [
      occurrenceKey({
        dueDate: row.due_date,
        reminderId: row.payment_reminder_id,
      }),
      row,
    ]),
  );
}

export async function findMatchingExpense(
  occurrence: {
    account: ExpenseAccount;
    amount: string;
    amountTolerance: string;
    categoryId: number;
    dueDate: string;
    matchText: string | null;
    subcategoryId: number | null;
  },
): Promise<PaymentMatchExpenseRow | undefined> {
  const values: Array<string | number | null> = [
    occurrence.account,
    occurrence.categoryId,
    occurrence.subcategoryId,
    occurrence.amount,
    occurrence.amountTolerance,
    occurrence.dueDate,
  ];
  const filters = [
    'expenses.account = $1',
    'expenses.category_id = $2',
    '((expenses.subcategory_id is null and $3::int is null) or expenses.subcategory_id = $3::int)',
    'expenses.amount between ($4::numeric - $5::numeric) and ($4::numeric + $5::numeric)',
    `expenses.date between ($6::date - interval '${matchWindowDaysBefore} days') and ($6::date + interval '${matchWindowDaysAfter} days')`,
  ];

  const result = await pool.query<PaymentMatchExpenseRow>(
    `
      select
        id,
        to_char(date, 'YYYY-MM-DD') as date,
        amount::numeric(12, 2)::text as amount,
        description,
        bank_concept,
        account,
        category_id,
        subcategory_id
      from expenses
      where ${filters.join(' and ')}
      order by abs(date - $6::date), abs(amount - $4::numeric), date desc
      limit 10;
    `,
    values,
  );

  return result.rows.find((expense) =>
    isPaymentReminderExpenseMatch(
      {
        account: occurrence.account,
        amount: occurrence.amount,
        amountTolerance: occurrence.amountTolerance,
        categoryId: occurrence.categoryId,
        matchText: occurrence.matchText,
        subcategoryId: occurrence.subcategoryId,
      },
      {
        account: expense.account,
        amount: expense.amount,
        bankConcept: expense.bank_concept,
        categoryId: expense.category_id,
        date: expense.date,
        description: expense.description,
        subcategoryId: expense.subcategory_id,
      },
      occurrence.dueDate,
    ),
  );
}

export async function upsertOccurrenceStatus({
  dueDate,
  matchedExpenseId,
  paymentReminderId,
  status,
}: {
  dueDate: string;
  matchedExpenseId: string | null;
  paymentReminderId: string;
  status: PaymentOccurrenceStatus;
}) {
  const result = await pool.query<PaymentOccurrenceOverrideRow>(
    `
      insert into payment_reminder_occurrences (
        payment_reminder_id,
        due_date,
        status,
        matched_expense_id,
        paid_at,
        skipped_at,
        updated_at
      )
      values (
        $1,
        $2,
        $3,
        $4,
        case when $3::payment_occurrence_status = 'paid' then now() else null end,
        case when $3::payment_occurrence_status = 'skipped' then now() else null end,
        now()
      )
      on conflict (payment_reminder_id, due_date) do update
      set
        status = excluded.status,
        matched_expense_id = excluded.matched_expense_id,
        paid_at = excluded.paid_at,
        skipped_at = excluded.skipped_at,
        updated_at = now()
      returning
        id,
        payment_reminder_id,
        to_char(due_date, 'YYYY-MM-DD') as due_date,
        status,
        matched_expense_id,
        paid_at::text as paid_at,
        skipped_at::text as skipped_at;
    `,
    [paymentReminderId, dueDate, status, matchedExpenseId],
  );
  const row = result.rows[0];

  if (row === undefined) {
    throw new Error('Unable to update payment occurrence');
  }

  return row;
}
