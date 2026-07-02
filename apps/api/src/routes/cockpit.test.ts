import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type {
  CockpitSubjectListResponse,
  CockpitSubjectSlug,
  ExpenseAccount,
} from '@finance/shared';
import Fastify from 'fastify';
import {
  registerCockpitRoutes,
  type CockpitSubjectQuery,
} from './cockpit.js';
import type { CockpitTransactionRow } from '../cockpit/subjectAnalysis.js';
import type { PaymentReminderRow } from '../payment-reminders/types.js';

describe('registerCockpitRoutes', () => {
  it('summarizes predefined subjects with exact non-overlapping rules', async () => {
    const app = buildTestApp();

    const response = await app.inject({
      method: 'GET',
      url: '/subjects?from=2026-06-01&to=2026-06-30',
    });

    assert.equal(response.statusCode, 200);

    const payload = response.json<CockpitSubjectListResponse>();
    const home = findSubject(payload, 'home');
    const flat = findSubject(payload, 'flat');
    const parking = findSubject(payload, 'parking');
    const salaries = findSubject(payload, 'salaries');
    const car = findSubject(payload, 'car');

    assert.equal(home.totals.expenses, '50.00');
    assert.equal(home.totals.income, '0.00');
    assert.equal(home.transactionCount, 1);
    assert.equal(home.upcoming.count, 1);
    assert.equal(home.upcoming.total, '30.00');
    assert.equal(home.upcoming.nextOccurrence?.reminderName, 'Internet');

    assert.equal(flat.totals.expenses, '1175.00');
    assert.equal(flat.totals.income, '1200.00');
    assert.equal(flat.transactionCount, 5);

    assert.equal(parking.totals.expenses, '42.00');
    assert.equal(parking.totals.income, '100.00');
    assert.equal(parking.transactionCount, 3);

    assert.equal(salaries.totals.expenses, '0.00');
    assert.equal(salaries.totals.income, '3000.00');
    assert.equal(salaries.transactionCount, 1);

    assert.equal(car.totals.expenses, '75.00');
    assert.equal(car.totals.income, '0.00');
    assert.equal(car.transactionCount, 1);

    await app.close();
  });

  it('returns subject detail with monthly cashflow, breakdown, reminders, and transactions', async () => {
    const app = buildTestApp();

    const response = await app.inject({
      method: 'GET',
      url: '/subjects/home?from=2026-06-01&to=2026-06-30',
    });

    assert.equal(response.statusCode, 200);

    const payload = response.json<{
      subject: {
        breakdown: Array<{
          category: string;
          categoryId: number;
          subcategory: string | null;
          subcategoryId: number | null;
          total: string;
          transactionCount: number;
          type: string;
        }>;
        monthlyCashflow: Array<{
          expenses: string;
          income: string;
          net: string;
          period: string;
        }>;
        recentTransactions: Array<{
          id: string;
        }>;
        upcomingOccurrences: Array<{
          reminderName: string;
        }>;
      };
    }>();

    assert.deepEqual(payload.subject.monthlyCashflow, [
      {
        expenses: '50.00',
        income: '0.00',
        net: '-50.00',
        period: '2026-06',
      },
    ]);
    assert.deepEqual(payload.subject.breakdown, [
      {
        category: 'DESPESES',
        categoryId: 10,
        subcategory: 'Llum',
        subcategoryId: 101,
        total: '50.00',
        transactionCount: 1,
        type: 'expense',
      },
    ]);
    assert.deepEqual(
      payload.subject.recentTransactions.map((transaction) => transaction.id),
      ['home-shared'],
    );
    assert.deepEqual(
      payload.subject.upcomingOccurrences.map(
        (occurrence) => occurrence.reminderName,
      ),
      ['Internet'],
    );

    await app.close();
  });

  it('returns flat bank and property insight cards', async () => {
    const app = buildTestApp();

    const response = await app.inject({
      method: 'GET',
      url: '/subjects/flat?from=2026-06-01&to=2026-06-30',
    });

    assert.equal(response.statusCode, 200);

    const payload = response.json<{
      subject: {
        insights: {
          groups: Array<{
            metrics: Array<{
              label: string;
              value: string;
            }>;
            title: string;
          }>;
        };
      };
    }>();

    assert.deepEqual(
      payload.subject.insights.groups.map((group) => ({
        metrics: group.metrics.map((metric) => [
          metric.label,
          metric.value,
        ]),
        title: group.title,
      })),
      [
        {
          title: 'Bank payments',
          metrics: [
            ['Quotas paid', '1'],
            ['Quota total', '900.00'],
            ['Amortization', '200.00'],
            ['Bank total', '1100.00'],
          ],
        },
        {
          title: 'Property expenses',
          metrics: [
            ['IBI Barcelona', '50.00'],
            ['Comunitat Pis', '25.00'],
            ['Property total', '75.00'],
          ],
        },
      ],
    );

    await app.close();
  });

  it('returns salary timeline by enterprise subcategory', async () => {
    const app = buildTestApp();

    const response = await app.inject({
      method: 'GET',
      url: '/subjects/salaries?from=2026-01-01&to=2026-06-30',
    });

    assert.equal(response.statusCode, 200);

    const payload = response.json<{
      subject: {
        insights: {
          timeline: Array<{
            count: number;
            endDate: string | null;
            label: string;
            startDate: string | null;
            total: string;
          }>;
        };
      };
    }>();

    assert.deepEqual(payload.subject.insights.timeline, [
      {
        count: 2,
        detail: '2 salary payments',
        endDate: '2026-06-28',
        label: 'ACME',
        startDate: '2026-05-28',
        total: '6000.00',
      },
      {
        count: 1,
        detail: '1 salary payment',
        endDate: '2026-04-28',
        label: 'OLDCO',
        startDate: '2026-04-28',
        total: '2500.00',
      },
    ]);

    await app.close();
  });

  it('applies date and account filters', async () => {
    const app = buildTestApp();

    const mayResponse = await app.inject({
      method: 'GET',
      url: '/subjects?from=2026-05-01&to=2026-05-31',
    });
    const sharedResponse = await app.inject({
      method: 'GET',
      url: '/subjects?from=2026-06-01&to=2026-06-30&account=shared',
    });

    assert.equal(mayResponse.statusCode, 200);
    assert.equal(sharedResponse.statusCode, 200);

    const mayPayload = mayResponse.json<CockpitSubjectListResponse>();
    const sharedPayload = sharedResponse.json<CockpitSubjectListResponse>();

    assert.equal(findSubject(mayPayload, 'home').totals.expenses, '44.00');
    assert.equal(findSubject(mayPayload, 'flat').totals.expenses, '0.00');

    assert.equal(findSubject(sharedPayload, 'home').totals.expenses, '50.00');
    assert.equal(findSubject(sharedPayload, 'flat').totals.expenses, '0.00');
    assert.equal(findSubject(sharedPayload, 'parking').totals.expenses, '0.00');
    assert.equal(findSubject(sharedPayload, 'home').upcoming.total, '30.00');
    assert.equal(findSubject(sharedPayload, 'parking').upcoming.total, '0.00');

    await app.close();
  });

  it('returns 404 for an unknown subject', async () => {
    const app = buildTestApp();

    const response = await app.inject({
      method: 'GET',
      url: '/subjects/unknown',
    });

    assert.equal(response.statusCode, 404);

    await app.close();
  });
});

function buildTestApp() {
  const app = Fastify({ logger: false });

  void app.register(registerCockpitRoutes, {
    fetchReminders: async (account: ExpenseAccount | undefined) =>
      account === undefined
        ? testReminders
        : testReminders.filter((reminder) => reminder.account === account),
    fetchTransactions: async (query: CockpitSubjectQuery) =>
      filterTransactions(testTransactions, query),
    today: () => '2026-06-15',
  });

  return app;
}

function filterTransactions(
  rows: CockpitTransactionRow[],
  query: CockpitSubjectQuery,
): CockpitTransactionRow[] {
  return rows.filter((row) => {
    if (query.account !== undefined && row.account !== query.account) {
      return false;
    }

    if (query.from !== undefined && row.date < query.from) {
      return false;
    }

    if (query.to !== undefined && row.date > query.to) {
      return false;
    }

    return true;
  });
}

function findSubject(
  payload: CockpitSubjectListResponse,
  slug: CockpitSubjectSlug,
) {
  const subject = payload.subjects.find((item) => item.slug === slug);

  assert.ok(subject);

  return subject;
}

function transaction(
  overrides: Partial<CockpitTransactionRow>,
): CockpitTransactionRow {
  return {
    account: 'mine',
    amount: '10.00',
    bank_concept: null,
    category: 'DESPESES',
    category_id: 1,
    date: '2026-06-10',
    description: null,
    id: 'transaction',
    subcategory: null,
    subcategory_id: null,
    type: 'expense',
    ...overrides,
  };
}

function reminder(overrides: Partial<PaymentReminderRow>): PaymentReminderRow {
  return {
    account: 'mine',
    active: true,
    amount: '10.00',
    amount_tolerance: '5.00',
    cadence: 'monthly',
    category: 'DESPESES',
    category_id: 1,
    created_at: '2026-01-01T00:00:00.000Z',
    due_day: 20,
    id: 'reminder',
    lead_days: 7,
    match_text: null,
    name: 'Reminder',
    source: 'manual',
    start_date: '2026-01-01',
    subcategory: null,
    subcategory_id: null,
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

const testTransactions: CockpitTransactionRow[] = [
  transaction({
    account: 'shared',
    amount: '100.00',
    category: 'DESPESES',
    category_id: 10,
    description: 'Electric utility monthly bill',
    id: 'home-shared',
    subcategory: 'Llum',
    subcategory_id: 101,
  }),
  transaction({
    amount: '900.00',
    category: 'PIS',
    category_id: 20,
    id: 'flat-mortgage',
    subcategory: 'Hipoteca',
    subcategory_id: 201,
  }),
  transaction({
    amount: '200.00',
    category: 'PIS',
    category_id: 20,
    id: 'flat-amortization',
    subcategory: 'Amortització',
    subcategory_id: 204,
  }),
  transaction({
    amount: '50.00',
    category: 'DESPESES PIS BCN',
    category_id: 21,
    id: 'flat-ibi-barcelona',
    subcategory: 'IBI Barcelona',
    subcategory_id: 205,
  }),
  transaction({
    amount: '25.00',
    category: 'DESPESES PIS BCN',
    category_id: 21,
    id: 'flat-community',
    subcategory: 'Comunitat Pis',
    subcategory_id: 206,
  }),
  transaction({
    amount: '30.00',
    category: 'PIS',
    category_id: 20,
    description: 'Flat lights',
    id: 'flat-home-overlap',
    subcategory: 'Llum',
    subcategory_id: 202,
  }),
  transaction({
    amount: '80.00',
    category: 'Transport',
    category_id: 30,
    id: 'ignored-parking-fee',
    subcategory: 'Parking',
    subcategory_id: 301,
  }),
  transaction({
    account: 'shared',
    amount: '20.00',
    category: 'Transport',
    category_id: 30,
    id: 'ignored-shared-parking',
    subcategory: 'Parking',
    subcategory_id: 301,
  }),
  transaction({
    amount: '12.00',
    category: 'PIS',
    category_id: 20,
    id: 'parking-tax-overlap',
    subcategory: 'IBI Parking',
    subcategory_id: 203,
  }),
  transaction({
    amount: '30.00',
    category: 'PIS',
    category_id: 20,
    id: 'parking-community',
    subcategory: 'Comunitat Parking',
    subcategory_id: 207,
  }),
  transaction({
    amount: '1200.00',
    category: 'Lloguer',
    category_id: 40,
    id: 'flat-rent-income',
    subcategory: 'Pis',
    subcategory_id: 401,
    type: 'income',
  }),
  transaction({
    amount: '100.00',
    category: 'Lloguer',
    category_id: 40,
    id: 'parking-income',
    subcategory: 'Parking',
    subcategory_id: 402,
    type: 'income',
  }),
  transaction({
    amount: '3000.00',
    category: 'SALARI',
    category_id: 50,
    date: '2026-06-28',
    id: 'salary-acme-june',
    subcategory: 'ACME',
    subcategory_id: 501,
    type: 'income',
  }),
  transaction({
    amount: '3000.00',
    category: 'SALARI',
    category_id: 50,
    date: '2026-05-28',
    id: 'salary-acme-may',
    subcategory: 'ACME',
    subcategory_id: 501,
    type: 'income',
  }),
  transaction({
    amount: '2500.00',
    category: 'SALARI',
    category_id: 50,
    date: '2026-04-28',
    id: 'salary-oldco',
    subcategory: 'OLDCO',
    subcategory_id: 502,
    type: 'income',
  }),
  transaction({
    amount: '75.00',
    category: 'COTXE',
    category_id: 60,
    id: 'car-fuel',
    subcategory: 'Gasolina',
    subcategory_id: 601,
  }),
  transaction({
    amount: '44.00',
    category: 'DESPESES',
    category_id: 10,
    date: '2026-05-10',
    id: 'old-home',
    subcategory: 'Internet',
    subcategory_id: 102,
  }),
];

const testReminders: PaymentReminderRow[] = [
  reminder({
    account: 'shared',
    amount: '60.00',
    category: 'DESPESES',
    category_id: 10,
    id: 'home-reminder',
    match_text: 'internet',
    name: 'Internet',
    subcategory: 'Internet',
    subcategory_id: 102,
  }),
  reminder({
    amount: '100.00',
    category: 'Transport',
    category_id: 30,
    id: 'ignored-parking-reminder',
    name: 'Parking',
    subcategory: 'Parking',
    subcategory_id: 301,
  }),
];
