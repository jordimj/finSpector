import { pool } from '@finance/db';
import type { ExpenseAccount } from '@finance/shared';
import type {
  NormalizedPaymentReminderBody,
  PaymentReminderRow,
} from './types.js';

export async function getPaymentReminderRows(account?: ExpenseAccount) {
  const values: ExpenseAccount[] = [];
  const filters = ['payment_reminders.active = true'];

  if (account !== undefined) {
    values.push(account);
    filters.push(`payment_reminders.account = $${values.length}`);
  }

  const result = await pool.query<PaymentReminderRow>(
    `
      ${paymentReminderSelectSql()}
      where ${filters.join(' and ')}
      order by payment_reminders.due_day, payment_reminders.name;
    `,
    values,
  );

  return result.rows;
}

export async function getPaymentReminderById(id: string) {
  const result = await pool.query<PaymentReminderRow>(
    `
      ${paymentReminderSelectSql()}
      where payment_reminders.id = $1;
    `,
    [id],
  );
  const row = result.rows[0];

  if (row === undefined) {
    throw Object.assign(new Error('Payment reminder not found'), {
      statusCode: 404,
    });
  }

  return row;
}

export async function createPaymentReminder(
  reminder: NormalizedPaymentReminderBody,
) {
  const result = await pool.query<{ id: string }>(
    `
      insert into payment_reminders (
        name,
        amount,
        amount_tolerance,
        cadence,
        source,
        account,
        category_id,
        subcategory_id,
        match_text,
        start_date,
        due_day,
        lead_days,
        updated_at
      )
      values (
        $1,
        $2,
        $3,
        $4,
        $5,
        $6,
        $7,
        $8,
        $9,
        $10,
        $11,
        $12,
        now()
      )
      returning id;
    `,
    [
      reminder.name,
      reminder.amount,
      reminder.amountTolerance,
      reminder.cadence,
      reminder.source,
      reminder.account,
      reminder.categoryId,
      reminder.subcategoryId,
      reminder.matchText,
      reminder.startDate,
      reminder.dueDay,
      reminder.leadDays,
    ],
  );
  const id = result.rows[0]?.id;

  if (id === undefined) {
    throw new Error('Unable to create payment reminder');
  }

  return getPaymentReminderById(id);
}

export async function updatePaymentReminder(
  id: string,
  reminder: NormalizedPaymentReminderBody,
) {
  await pool.query(
    `
      update payment_reminders
      set
        name = $2,
        amount = $3,
        amount_tolerance = $4,
        cadence = $5,
        source = $6,
        account = $7,
        category_id = $8,
        subcategory_id = $9,
        match_text = $10,
        start_date = $11,
        due_day = $12,
        lead_days = $13,
        updated_at = now()
      where id = $1;
    `,
    [
      id,
      reminder.name,
      reminder.amount,
      reminder.amountTolerance,
      reminder.cadence,
      reminder.source,
      reminder.account,
      reminder.categoryId,
      reminder.subcategoryId,
      reminder.matchText,
      reminder.startDate,
      reminder.dueDay,
      reminder.leadDays,
    ],
  );

  return getPaymentReminderById(id);
}

export async function deactivatePaymentReminder(id: string): Promise<void> {
  await pool.query(
    `
      update payment_reminders
      set active = false, updated_at = now()
      where id = $1;
    `,
    [id],
  );
}

function paymentReminderSelectSql(): string {
  return `
    select
      payment_reminders.id,
      payment_reminders.name,
      payment_reminders.amount::numeric(12, 2)::text as amount,
      payment_reminders.amount_tolerance::numeric(12, 2)::text as amount_tolerance,
      payment_reminders.cadence,
      payment_reminders.source,
      payment_reminders.account,
      payment_reminders.category_id,
      categories.name as category,
      payment_reminders.subcategory_id,
      subcategories.name as subcategory,
      payment_reminders.match_text,
      to_char(payment_reminders.start_date, 'YYYY-MM-DD') as start_date,
      payment_reminders.due_day,
      payment_reminders.lead_days,
      payment_reminders.active,
      payment_reminders.created_at::text as created_at,
      payment_reminders.updated_at::text as updated_at
    from payment_reminders
    join categories on categories.id = payment_reminders.category_id
    left join subcategories on subcategories.id = payment_reminders.subcategory_id
  `;
}
