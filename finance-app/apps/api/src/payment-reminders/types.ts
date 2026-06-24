import type {
  ExpenseAccount,
  PaymentCadence,
  PaymentReminderSource,
} from '@finance/shared';

export type PaymentReminderRow = {
  id: string;
  name: string;
  amount: string;
  amount_tolerance: string;
  cadence: PaymentCadence;
  source: PaymentReminderSource;
  account: ExpenseAccount;
  category_id: number;
  category: string;
  subcategory_id: number | null;
  subcategory: string | null;
  match_text: string | null;
  start_date: string;
  due_day: number;
  lead_days: number;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type PaymentOccurrenceStatus = 'paid' | 'skipped';

export type PaymentOccurrenceOverrideRow = {
  id: string;
  payment_reminder_id: string;
  due_date: string;
  status: PaymentOccurrenceStatus;
  matched_expense_id: string | null;
  paid_at: string | null;
  skipped_at: string | null;
};

export type PaymentMatchExpenseRow = {
  id: string;
  date: string;
  amount: string;
  description: string | null;
  bank_concept: string | null;
  account: ExpenseAccount;
  category_id: number;
  subcategory_id: number | null;
};

export type CandidateExpenseRow = PaymentMatchExpenseRow & {
  category: string;
  subcategory: string | null;
};

export type PaymentReminderForOccurrence = {
  id: string;
  name: string;
  amount: string;
  amountTolerance: string;
  cadence: PaymentCadence;
  account: ExpenseAccount;
  categoryId: number;
  category: string;
  subcategoryId: number | null;
  subcategory: string | null;
  matchText: string | null;
  startDate: string;
  dueDay: number;
  leadDays: number;
};

export type CandidateExpenseInput = {
  date: string;
  amount: string;
  description: string | null;
  bankConcept: string | null;
  account: ExpenseAccount;
  categoryId: number;
  category: string;
  subcategoryId: number | null;
  subcategory: string | null;
};

export type PaymentMatchInput = {
  date: string;
  amount: string;
  description: string | null;
  bankConcept: string | null;
  account: ExpenseAccount;
  categoryId: number;
  subcategoryId: number | null;
};

export type PaymentReminderBody = {
  account?: ExpenseAccount;
  amount?: string | number;
  amountTolerance?: string | number;
  categoryId?: number;
  cadence?: PaymentCadence;
  dueDay?: number;
  leadDays?: number;
  matchText?: string | null;
  name?: string;
  source?: PaymentReminderSource;
  startDate?: string;
  subcategoryId?: number | null;
};

export type PaymentReminderQuery = {
  account?: ExpenseAccount;
  days?: number;
};

export type PaymentReminderParams = {
  id: string;
};

export type OccurrenceParams = {
  dueDate: string;
  id: string;
};

export type DismissCandidateBody = {
  key?: string;
};

export type UpcomingSummary = {
  dueSoonCount: number;
  horizonDays: number;
  overdueCount: number;
  paidCount: number;
  skippedCount: number;
  totalOpenAmount: string;
  upcomingCount: number;
};

export type NormalizedPaymentReminderBody = {
  account: ExpenseAccount;
  amount: string;
  amountTolerance: string;
  cadence: PaymentCadence;
  categoryId: number;
  dueDay: number;
  leadDays: number;
  matchText: string | null;
  name: string;
  source: PaymentReminderSource;
  startDate: string;
  subcategoryId: number | null;
};
