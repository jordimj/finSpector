import {
  COCKPIT_SUBJECT_SLUGS,
  EXPENSE_ACCOUNTS,
  PAYMENT_CADENCES,
  PAYMENT_OCCURRENCE_STATES,
  PAYMENT_REMINDER_SOURCES,
  TRANSACTION_TYPES,
} from './constants.js';

export type TransactionType = (typeof TRANSACTION_TYPES)[number];
export type ExpenseAccount = (typeof EXPENSE_ACCOUNTS)[number];
export type PaymentCadence = (typeof PAYMENT_CADENCES)[number];
export type PaymentReminderSource = (typeof PAYMENT_REMINDER_SOURCES)[number];
export type PaymentOccurrenceState =
  (typeof PAYMENT_OCCURRENCE_STATES)[number];
export type CockpitSubjectSlug = (typeof COCKPIT_SUBJECT_SLUGS)[number];

export type RawTransactionRow = {
  date: string;
  amount: string;
  description: string;
  bankConcept?: string;
  category?: string;
  subcategory?: string;
  type?: string;
};

export type NormalizedTransaction = {
  date: string;
  amount: string;
  description?: string;
  bankConcept?: string;
  categoryName: string;
  subcategoryName?: string;
  type: TransactionType;
};

export type Transaction = {
  id: string;
  date: string;
  amount: string;
  description: string | null;
  category: string;
  subcategory: string | null;
  account: ExpenseAccount | null;
  type: TransactionType;
};

export type PaymentReminder = {
  id: string;
  name: string;
  amount: string;
  amountTolerance: string;
  cadence: PaymentCadence;
  source: PaymentReminderSource;
  account: ExpenseAccount;
  categoryId: number;
  category: string;
  subcategoryId: number | null;
  subcategory: string | null;
  matchText: string | null;
  startDate: string;
  dueDay: number;
  leadDays: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PaymentReminderOccurrence = {
  id: string | null;
  reminderId: string;
  reminderName: string;
  amount: string;
  amountTolerance: string;
  account: ExpenseAccount;
  categoryId: number;
  category: string;
  subcategoryId: number | null;
  subcategory: string | null;
  matchText: string | null;
  dueDate: string;
  state: PaymentOccurrenceState;
  matchedExpenseId: string | null;
  paidAt: string | null;
  skippedAt: string | null;
};

export type PaymentReminderCandidate = {
  key: string;
  name: string;
  amount: string;
  amountTolerance: string;
  cadence: PaymentCadence;
  account: ExpenseAccount;
  categoryId: number;
  category: string;
  subcategoryId: number | null;
  subcategory: string | null;
  matchText: string;
  dueDay: number;
  nextDueDate: string;
  lastPaidDate: string;
  transactionCount: number;
  monthCount: number;
  confidence: number;
};

export type ImportSummary = {
  importId: string;
  sourceName: string;
  totalRows: number;
  insertedExpenses: number;
  insertedIncome: number;
  duplicateRows: number;
  skippedRows: number;
};

export type CockpitAmountTotals = {
  income: string;
  expenses: string;
  net: string;
};

export type CockpitUpcomingSummary = {
  count: number;
  nextOccurrence: PaymentReminderOccurrence | null;
  total: string;
};

export type CockpitSubjectSummary = {
  description: string;
  name: string;
  slug: CockpitSubjectSlug;
  totals: CockpitAmountTotals;
  transactionCount: number;
  upcoming: CockpitUpcomingSummary;
};

export type CockpitCashflowPeriod = CockpitAmountTotals & {
  period: string;
};

export type CockpitBreakdownItem = {
  category: string;
  categoryId: number;
  subcategory: string | null;
  subcategoryId: number | null;
  total: string;
  transactionCount: number;
  type: TransactionType;
};

export type CockpitInsightMetricTone =
  | 'amber'
  | 'cyan'
  | 'green'
  | 'lavender'
  | 'rose';

export type CockpitInsightMetric = {
  detail: string;
  label: string;
  tone: CockpitInsightMetricTone;
  value: string;
};

export type CockpitInsightGroup = {
  description: string;
  metrics: CockpitInsightMetric[];
  title: string;
};

export type CockpitInsightTimelineItem = {
  count: number;
  detail: string;
  endDate: string | null;
  label: string;
  startDate: string | null;
  total: string;
};

export type CockpitSubjectInsights = {
  groups: CockpitInsightGroup[];
  timeline: CockpitInsightTimelineItem[];
};

export type CockpitSubjectDetail = CockpitSubjectSummary & {
  breakdown: CockpitBreakdownItem[];
  insights: CockpitSubjectInsights;
  monthlyCashflow: CockpitCashflowPeriod[];
  recentTransactions: Transaction[];
  upcomingOccurrences: PaymentReminderOccurrence[];
};

export type CockpitSubjectListResponse = {
  subjects: CockpitSubjectSummary[];
};

export type CockpitSubjectDetailResponse = {
  subject: CockpitSubjectDetail;
};
