import {
  COCKPIT_SUBJECT_SLUGS,
  DEFAULT_PAYMENT_REMINDER_HORIZON_DAYS,
  getPersonalTransactionAmount,
  type CockpitAmountTotals,
  type CockpitBreakdownItem,
  type CockpitCashflowPeriod,
  type CockpitInsightGroup,
  type CockpitInsightTimelineItem,
  type CockpitSubjectInsights,
  type CockpitSubjectDetail,
  type CockpitSubjectSlug,
  type CockpitSubjectSummary,
  type ExpenseAccount,
  type PaymentReminderOccurrence,
  type Transaction,
  type TransactionType,
} from '@finance/shared';
import { addDays } from '../payment-reminders/date.js';
import { toMoneyText } from '../payment-reminders/money.js';
import {
  compareOccurrences,
  generatePaymentReminderOccurrences,
} from '../payment-reminders/occurrences.js';
import { toOccurrenceReminder } from '../payment-reminders/serializers.js';
import type { PaymentReminderRow } from '../payment-reminders/types.js';

export type CockpitTransactionRow = {
  id: string;
  date: string;
  amount: string;
  description: string | null;
  bank_concept: string | null;
  category_id: number;
  category: string;
  subcategory_id: number | null;
  subcategory: string | null;
  account: ExpenseAccount | null;
  type: TransactionType;
};

type CockpitBuildInput = {
  from?: string;
  reminders: PaymentReminderRow[];
  to?: string;
  today: string;
  transactions: CockpitTransactionRow[];
};

type CockpitSubjectDefinition = {
  description: string;
  name: string;
  slug: CockpitSubjectSlug;
};

type MatchableSubjectRow = {
  bankConcept?: string | null;
  category: string;
  description?: string | null;
  matchText?: string | null;
  subcategory: string | null;
  type?: TransactionType;
};

const cockpitSubjects: CockpitSubjectDefinition[] = [
  {
    slug: 'home',
    name: 'Home',
    description: 'Utilities, services, furnishings, and household running costs',
  },
  {
    slug: 'flat',
    name: 'Flat',
    description: 'Mortgage, amortization, taxes, insurance, and flat rent',
  },
  {
    slug: 'parking',
    name: 'Parking',
    description: 'Parking rent, fees, reminders, and related activity',
  },
  {
    slug: 'salaries',
    name: 'Salaries',
    description: 'Salary income by employer and working period',
  },
  {
    slug: 'car',
    name: 'Car',
    description: 'Car expenses from the Cotxe category',
  },
];

const flatBankExpenseSubcategoryNames = new Set([
  'amortitzacio',
  'hipoteca',
]);
const flatPropertyExpenseSubcategoryNames = new Set([
  'comunitat pis',
  'ibi barcelona',
]);
const flatExpenseSubcategoryNames = new Set([
  ...flatBankExpenseSubcategoryNames,
  ...flatPropertyExpenseSubcategoryNames,
]);
const homeExpenseCategoryNames = new Set(['casa', 'despeses']);
const parkingExpenseSubcategoryNames = new Set([
  'comunitat parking',
  'ibi parking',
]);

export function isCockpitSubjectSlug(value: string): value is CockpitSubjectSlug {
  return COCKPIT_SUBJECT_SLUGS.some((slug) => slug === value);
}

export function buildCockpitSubjectSummaries(
  input: CockpitBuildInput,
): CockpitSubjectSummary[] {
  return cockpitSubjects.map((subject) =>
    buildCockpitSubjectResult(subject, input),
  );
}

export function buildCockpitSubjectDetail(
  slug: CockpitSubjectSlug,
  input: CockpitBuildInput,
): CockpitSubjectDetail {
  const definition = getCockpitSubjectDefinition(slug);

  return buildCockpitSubjectResult(definition, input);
}

function getCockpitSubjectDefinition(
  slug: CockpitSubjectSlug,
): CockpitSubjectDefinition {
  const definition = cockpitSubjects.find((subject) => subject.slug === slug);

  if (definition === undefined) {
    throw new Error(`Unknown cockpit subject: ${slug}`);
  }

  return definition;
}

function buildCockpitSubjectResult(
  subject: CockpitSubjectDefinition,
  input: CockpitBuildInput,
): CockpitSubjectDetail {
  const transactions = input.transactions.filter((transaction) =>
    matchesCockpitSubject(subject.slug, transaction),
  );
  const occurrences = buildSubjectOccurrences(subject.slug, input);
  const totals = summarizeTransactions(transactions);

  return {
    breakdown: buildBreakdown(transactions),
    description: subject.description,
    insights: buildSubjectInsights(subject.slug, transactions),
    monthlyCashflow: buildMonthlyCashflow(transactions),
    name: subject.name,
    recentTransactions: buildRecentTransactions(transactions),
    slug: subject.slug,
    totals,
    transactionCount: transactions.length,
    upcoming: summarizeUpcomingOccurrences(occurrences),
    upcomingOccurrences: occurrences,
  };
}

function matchesCockpitSubject(
  slug: CockpitSubjectSlug,
  row: MatchableSubjectRow,
): boolean {
  if (slug === 'flat') {
    if (matchesParking(row)) {
      return false;
    }

    return matchesFlat(row);
  }

  if (slug === 'parking') {
    return matchesParking(row);
  }

  if (slug === 'salaries') {
    return matchesSalaries(row);
  }

  if (slug === 'car') {
    return matchesCar(row);
  }

  return matchesHome(row);
}

function matchesFlat(row: MatchableSubjectRow): boolean {
  const category = normalizeText(row.category);
  const subcategory = normalizeText(row.subcategory ?? '');

  if (row.type === 'income') {
    return category === 'lloguer' && subcategory === 'pis';
  }

  return flatExpenseSubcategoryNames.has(subcategory);
}

function matchesParking(row: MatchableSubjectRow): boolean {
  const category = normalizeText(row.category);
  const subcategory = normalizeText(row.subcategory ?? '');

  if (row.type === 'income') {
    return category === 'lloguer' && subcategory === 'parking';
  }

  return parkingExpenseSubcategoryNames.has(subcategory);
}

function matchesHome(row: MatchableSubjectRow): boolean {
  const category = normalizeText(row.category);

  if (row.type === 'income') {
    return false;
  }

  return (
    !matchesFlat(row) &&
    !matchesParking(row) &&
    homeExpenseCategoryNames.has(category)
  );
}

function matchesSalaries(row: MatchableSubjectRow): boolean {
  return row.type === 'income' && normalizeText(row.category) === 'salari';
}

function matchesCar(row: MatchableSubjectRow): boolean {
  return row.type !== 'income' && normalizeText(row.category) === 'cotxe';
}

function buildSubjectOccurrences(
  slug: CockpitSubjectSlug,
  input: CockpitBuildInput,
): PaymentReminderOccurrence[] {
  const startDate = input.from ?? input.today;
  const endDate =
    input.to ?? addDays(startDate, DEFAULT_PAYMENT_REMINDER_HORIZON_DAYS);

  if (endDate < startDate) {
    return [];
  }

  return input.reminders
    .filter((reminder) =>
      matchesCockpitSubject(slug, {
        category: reminder.category,
        matchText: reminder.match_text,
        subcategory: reminder.subcategory,
      }),
    )
    .flatMap((reminder) =>
      generatePaymentReminderOccurrences(
        toOccurrenceReminder(reminder),
        startDate,
        endDate,
        input.today,
      ),
    )
    .sort(compareOccurrences);
}

function buildSubjectInsights(
  slug: CockpitSubjectSlug,
  transactions: CockpitTransactionRow[],
): CockpitSubjectInsights {
  const groups =
    slug === 'flat'
      ? buildFlatInsightGroups(transactions)
      : [];
  const timeline =
    slug === 'salaries' ? buildSalaryTimeline(transactions) : [];

  return {
    groups,
    timeline,
  };
}

function buildFlatInsightGroups(
  transactions: CockpitTransactionRow[],
): CockpitInsightGroup[] {
  const hipoteca = summarizeMatchingTransactions(transactions, (transaction) =>
    isExpenseSubcategory(transaction, 'hipoteca'),
  );
  const amortitzacio = summarizeMatchingTransactions(
    transactions,
    (transaction) => isExpenseSubcategory(transaction, 'amortitzacio'),
  );
  const ibiBarcelona = summarizeMatchingTransactions(
    transactions,
    (transaction) => isExpenseSubcategory(transaction, 'ibi barcelona'),
  );
  const comunitatPis = summarizeMatchingTransactions(
    transactions,
    (transaction) => isExpenseSubcategory(transaction, 'comunitat pis'),
  );
  const bankTotal = hipoteca.total + amortitzacio.total;
  const propertyTotal = ibiBarcelona.total + comunitatPis.total;

  return [
    {
      title: 'Bank payments',
      description: 'Mortgage quotas and extra amortization paid in this period',
      metrics: [
        {
          detail: 'Hipoteca rows',
          label: 'Quotas paid',
          tone: 'cyan',
          value: String(hipoteca.count),
        },
        {
          detail: 'Total paid as Hipoteca',
          label: 'Quota total',
          tone: 'lavender',
          value: toMoneyText(hipoteca.total),
        },
        {
          detail: 'Total paid as Amortització',
          label: 'Amortization',
          tone: 'amber',
          value: toMoneyText(amortitzacio.total),
        },
        {
          detail: 'Hipoteca + Amortització',
          label: 'Bank total',
          tone: 'rose',
          value: toMoneyText(bankTotal),
        },
      ],
    },
    {
      title: 'Property expenses',
      description: 'Only IBI Barcelona and Comunitat Pis',
      metrics: [
        {
          detail: `${ibiBarcelona.count} transaction${
            ibiBarcelona.count === 1 ? '' : 's'
          }`,
          label: 'IBI Barcelona',
          tone: 'lavender',
          value: toMoneyText(ibiBarcelona.total),
        },
        {
          detail: `${comunitatPis.count} transaction${
            comunitatPis.count === 1 ? '' : 's'
          }`,
          label: 'Comunitat Pis',
          tone: 'cyan',
          value: toMoneyText(comunitatPis.total),
        },
        {
          detail: 'IBI Barcelona + Comunitat Pis',
          label: 'Property total',
          tone: 'rose',
          value: toMoneyText(propertyTotal),
        },
      ],
    },
  ];
}

function buildSalaryTimeline(
  transactions: CockpitTransactionRow[],
): CockpitInsightTimelineItem[] {
  const employers = new Map<
    string,
    {
      count: number;
      endDate: string;
      label: string;
      startDate: string;
      total: number;
    }
  >();

  for (const transaction of transactions) {
    if (transaction.type !== 'income') {
      continue;
    }

    const label = transaction.subcategory ?? transaction.category;
    const key = normalizeText(label);
    const current = employers.get(key) ?? {
      count: 0,
      endDate: transaction.date,
      label,
      startDate: transaction.date,
      total: 0,
    };
    const amount = getPersonalTransactionAmount(
      Number(transaction.amount),
      transaction.account,
    );

    employers.set(key, {
      ...current,
      count: current.count + 1,
      endDate: transaction.date > current.endDate ? transaction.date : current.endDate,
      startDate:
        transaction.date < current.startDate ? transaction.date : current.startDate,
      total: current.total + amount,
    });
  }

  return Array.from(employers.values())
    .map((employer) => ({
      count: employer.count,
      detail: `${employer.count} salary payment${
        employer.count === 1 ? '' : 's'
      }`,
      endDate: employer.endDate,
      label: employer.label,
      startDate: employer.startDate,
      total: toMoneyText(employer.total),
    }))
    .sort((left, right) => right.endDate.localeCompare(left.endDate));
}

function summarizeMatchingTransactions(
  transactions: CockpitTransactionRow[],
  predicate: (transaction: CockpitTransactionRow) => boolean,
): {
  count: number;
  total: number;
} {
  return transactions.reduce(
    (summary, transaction) => {
      if (!predicate(transaction)) {
        return summary;
      }

      return {
        count: summary.count + 1,
        total:
          summary.total +
          getPersonalTransactionAmount(
            Number(transaction.amount),
            transaction.account,
          ),
      };
    },
    {
      count: 0,
      total: 0,
    },
  );
}

function isExpenseSubcategory(
  transaction: CockpitTransactionRow,
  subcategoryName: string,
): boolean {
  return (
    transaction.type === 'expense' &&
    normalizeText(transaction.subcategory ?? '') === subcategoryName
  );
}

function summarizeTransactions(
  transactions: CockpitTransactionRow[],
): CockpitAmountTotals {
  const totals = transactions.reduce(
    (current, transaction) => {
      const amount = getPersonalTransactionAmount(
        Number(transaction.amount),
        transaction.account,
      );

      if (transaction.type === 'income') {
        return {
          ...current,
          income: current.income + amount,
        };
      }

      return {
        ...current,
        expenses: current.expenses + amount,
      };
    },
    {
      expenses: 0,
      income: 0,
    },
  );

  return {
    expenses: toMoneyText(totals.expenses),
    income: toMoneyText(totals.income),
    net: toMoneyText(totals.income - totals.expenses),
  };
}

function summarizeUpcomingOccurrences(
  occurrences: PaymentReminderOccurrence[],
): CockpitSubjectSummary['upcoming'] {
  const total = occurrences.reduce(
    (sum, occurrence) =>
      sum +
      getPersonalTransactionAmount(Number(occurrence.amount), occurrence.account),
    0,
  );

  return {
    count: occurrences.length,
    nextOccurrence: occurrences[0] ?? null,
    total: toMoneyText(total),
  };
}

function buildMonthlyCashflow(
  transactions: CockpitTransactionRow[],
): CockpitCashflowPeriod[] {
  const periods = new Map<
    string,
    {
      expenses: number;
      income: number;
    }
  >();

  for (const transaction of transactions) {
    const period = transaction.date.slice(0, 7);
    const current = periods.get(period) ?? {
      expenses: 0,
      income: 0,
    };
    const amount = getPersonalTransactionAmount(
      Number(transaction.amount),
      transaction.account,
    );

    periods.set(period, {
      expenses:
        transaction.type === 'expense'
          ? current.expenses + amount
          : current.expenses,
      income:
        transaction.type === 'income' ? current.income + amount : current.income,
    });
  }

  return Array.from(periods.entries())
    .map(([period, totals]) => ({
      expenses: toMoneyText(totals.expenses),
      income: toMoneyText(totals.income),
      net: toMoneyText(totals.income - totals.expenses),
      period,
    }))
    .sort((left, right) => left.period.localeCompare(right.period));
}

function buildBreakdown(
  transactions: CockpitTransactionRow[],
): CockpitBreakdownItem[] {
  const breakdown = new Map<
    string,
    Omit<CockpitBreakdownItem, 'total'> & {
      totalAmount: number;
    }
  >();

  for (const transaction of transactions) {
    const key = [
      transaction.type,
      transaction.category_id,
      transaction.subcategory_id ?? 'none',
    ].join(':');
    const current = breakdown.get(key) ?? {
      category: transaction.category,
      categoryId: transaction.category_id,
      subcategory: transaction.subcategory,
      subcategoryId: transaction.subcategory_id,
      totalAmount: 0,
      transactionCount: 0,
      type: transaction.type,
    };

    breakdown.set(key, {
      ...current,
      totalAmount:
        current.totalAmount +
        getPersonalTransactionAmount(Number(transaction.amount), transaction.account),
      transactionCount: current.transactionCount + 1,
    });
  }

  return Array.from(breakdown.values())
    .map((row) => ({
      category: row.category,
      categoryId: row.categoryId,
      subcategory: row.subcategory,
      subcategoryId: row.subcategoryId,
      total: toMoneyText(row.totalAmount),
      transactionCount: row.transactionCount,
      type: row.type,
    }))
    .sort(compareBreakdownItems);
}

function compareBreakdownItems(
  left: CockpitBreakdownItem,
  right: CockpitBreakdownItem,
): number {
  if (left.type !== right.type) {
    return left.type === 'expense' ? -1 : 1;
  }

  return Number(right.total) - Number(left.total);
}

function buildRecentTransactions(
  transactions: CockpitTransactionRow[],
): Transaction[] {
  return [...transactions]
    .sort((left, right) => {
      const dateCompare = right.date.localeCompare(left.date);

      if (dateCompare !== 0) {
        return dateCompare;
      }

      return (left.description ?? '').localeCompare(right.description ?? '');
    })
    .slice(0, 8)
    .map((transaction) => ({
      account: transaction.account,
      amount: transaction.amount,
      category: transaction.category,
      date: transaction.date,
      description: transaction.description,
      id: transaction.id,
      subcategory: transaction.subcategory,
      type: transaction.type,
    }));
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}
