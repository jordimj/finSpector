import type { PaymentReminder, PaymentReminderOccurrence } from '@finance/shared';
import type {
  CandidateExpenseInput,
  CandidateExpenseRow,
  PaymentOccurrenceOverrideRow,
  PaymentReminderBody,
  PaymentReminderForOccurrence,
  PaymentReminderRow,
} from './types.js';

export function toPaymentReminderResponse(
  row: PaymentReminderRow,
): PaymentReminder {
  return {
    account: row.account,
    active: row.active,
    amount: row.amount,
    amountTolerance: row.amount_tolerance,
    cadence: row.cadence,
    category: row.category,
    categoryId: row.category_id,
    createdAt: row.created_at,
    dueDay: row.due_day,
    id: row.id,
    leadDays: row.lead_days,
    matchText: row.match_text,
    name: row.name,
    source: row.source,
    startDate: row.start_date,
    subcategory: row.subcategory,
    subcategoryId: row.subcategory_id,
    updatedAt: row.updated_at,
  };
}

export function toOccurrenceReminder(
  row: PaymentReminderRow,
): PaymentReminderForOccurrence {
  return {
    account: row.account,
    amount: row.amount,
    amountTolerance: row.amount_tolerance,
    cadence: row.cadence,
    category: row.category,
    categoryId: row.category_id,
    dueDay: row.due_day,
    id: row.id,
    leadDays: row.lead_days,
    matchText: row.match_text,
    name: row.name,
    startDate: row.start_date,
    subcategory: row.subcategory,
    subcategoryId: row.subcategory_id,
  };
}

export function toOccurrenceResponse(
  occurrence: PaymentReminderOccurrence,
  override?: PaymentOccurrenceOverrideRow,
): PaymentReminderOccurrence {
  if (override === undefined) {
    return occurrence;
  }

  return {
    ...occurrence,
    id: override.id,
    matchedExpenseId: override.matched_expense_id,
    paidAt: override.paid_at,
    skippedAt: override.skipped_at,
    state: override.status,
  };
}

export function toOccurrenceOverrideResponse(
  row: PaymentOccurrenceOverrideRow,
): Pick<
  PaymentReminderOccurrence,
  'dueDate' | 'id' | 'matchedExpenseId' | 'paidAt' | 'skippedAt' | 'state'
> {
  return {
    dueDate: row.due_date,
    id: row.id,
    matchedExpenseId: row.matched_expense_id,
    paidAt: row.paid_at,
    skippedAt: row.skipped_at,
    state: row.status,
  };
}

export function toCandidateExpenseInput(
  row: CandidateExpenseRow,
): CandidateExpenseInput {
  return {
    account: row.account,
    amount: row.amount,
    bankConcept: row.bank_concept,
    category: row.category,
    categoryId: row.category_id,
    date: row.date,
    description: row.description,
    subcategory: row.subcategory,
    subcategoryId: row.subcategory_id,
  };
}

export function toEditableBody(row: PaymentReminderRow): PaymentReminderBody {
  return {
    account: row.account,
    amount: row.amount,
    amountTolerance: row.amount_tolerance,
    cadence: row.cadence,
    categoryId: row.category_id,
    dueDay: row.due_day,
    leadDays: row.lead_days,
    matchText: row.match_text,
    name: row.name,
    source: row.source,
    startDate: row.start_date,
    subcategoryId: row.subcategory_id,
  };
}
