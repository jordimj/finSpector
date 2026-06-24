import type {
  ExpenseAccount,
  PaymentCadence,
  PaymentReminder,
  PaymentReminderCandidate,
  PaymentReminderOccurrence,
  PaymentReminderSource,
} from '@finance/shared';

export type PaymentReminderInput = {
  account: ExpenseAccount;
  amount: string;
  amountTolerance?: string;
  cadence?: PaymentCadence;
  categoryId: number;
  dueDay: number;
  leadDays?: number;
  matchText?: string | null;
  name: string;
  source?: PaymentReminderSource;
  startDate: string;
  subcategoryId?: number | null;
};

export type UpcomingPaymentSummary = {
  dueSoonCount: number;
  horizonDays: number;
  overdueCount: number;
  paidCount: number;
  skippedCount: number;
  totalOpenAmount: string;
  upcomingCount: number;
};

export type UpcomingPaymentRemindersResponse = {
  summary: UpcomingPaymentSummary;
  occurrences: PaymentReminderOccurrence[];
};

export type PaymentRemindersResponse = {
  reminders: PaymentReminder[];
};

export type PaymentReminderCandidatesResponse = {
  candidates: PaymentReminderCandidate[];
};

export type PaymentOccurrenceMutationInput = {
  dueDate: string;
  reminderId: string;
};
