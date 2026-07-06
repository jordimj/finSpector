import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import Fastify from 'fastify';
import {
  registerPaymentReminderRoutes,
  type PaymentReminderRouteDependencies,
} from './payment-reminders.js';
import type {
  PaymentOccurrenceOverrideRow,
  PaymentReminderRow,
} from '../payment-reminders/types.js';

const reminderId = '00000000-0000-4000-8000-000000000001';
type TestMethod = 'DELETE' | 'PATCH' | 'POST';

describe('registerPaymentReminderRoutes automatic calendar sync', () => {
  it('runs afterReminderChange after occurrence-changing mutations', async () => {
    const cases = [
      (events: string[]) => ({
        body: reminderBody(),
        method: 'POST',
        repository: {
          createPaymentReminder: async () => {
            events.push('mutation');

            return reminderRow();
          },
        },
        url: '/',
      }),
      (events: string[]) => ({
        body: {
          amount: '55.00',
        },
        method: 'PATCH',
        repository: {
          getPaymentReminderById: async () => reminderRow(),
          updatePaymentReminder: async () => {
            events.push('mutation');

            return reminderRow();
          },
        },
        url: `/${reminderId}`,
      }),
      (events: string[]) => ({
        method: 'DELETE',
        repository: {
          deactivatePaymentReminder: async () => {
            events.push('mutation');
          },
          getPaymentReminderById: async () => reminderRow(),
        },
        url: `/${reminderId}`,
      }),
      (events: string[]) => ({
        method: 'POST',
        repository: {
          getPaymentReminderById: async () => reminderRow(),
          upsertOccurrenceStatus: async () => {
            events.push('mutation');

            return occurrenceRow('paid');
          },
        },
        url: `/${reminderId}/occurrences/2026-07-15/mark-paid`,
      }),
      (events: string[]) => ({
        method: 'POST',
        repository: {
          getPaymentReminderById: async () => reminderRow(),
          upsertOccurrenceStatus: async () => {
            events.push('mutation');

            return occurrenceRow('skipped');
          },
        },
        url: `/${reminderId}/occurrences/2026-07-15/skip`,
      }),
    ] satisfies Array<(events: string[]) => {
      body?: Record<string, unknown>;
      method: TestMethod;
      repository: PaymentReminderRouteDependencies['repository'];
      url: string;
    }>;

    for (const buildTestCase of cases) {
      const events: string[] = [];
      const testCase = buildTestCase(events);
      const { response, syncCalls } = await injectWithSyncCounter(
        testCase,
        events,
      );

      assert.ok(
        response.statusCode >= 200 && response.statusCode < 300,
        `${testCase.method} ${testCase.url} returned ${response.statusCode}`,
      );
      assert.equal(syncCalls(), 1, testCase.url);
      assert.deepEqual(events, ['mutation', 'sync'], testCase.url);
    }
  });

  it('keeps reminder responses successful when afterReminderChange fails', async () => {
    const app = Fastify({ logger: false });

    await app.register(registerPaymentReminderRoutes, {
      afterReminderChange: async () => {
        throw new Error('Calendar unavailable');
      },
      repository: {
        createPaymentReminder: async () => reminderRow(),
      },
    });

    const response = await app.inject({
      body: reminderBody(),
      headers: {
        'content-type': 'application/json',
      },
      method: 'POST',
      url: '/',
    });

    assert.equal(response.statusCode, 201);

    await app.close();
  });

  it('does not run afterReminderChange for candidate dismissal', async () => {
    const { response, syncCalls } = await injectWithSyncCounter({
      body: {
        key: 'candidate-key',
      },
      method: 'POST',
      repository: {
        dismissPaymentReminderSuggestion: async () => {},
      },
      url: '/candidates/dismiss',
    });

    assert.equal(response.statusCode, 200);
    assert.equal(syncCalls(), 0);
  });
});

async function injectWithSyncCounter({
  body,
  method,
  repository,
  url,
}: {
  body?: Record<string, unknown>;
  method: TestMethod;
  repository: PaymentReminderRouteDependencies['repository'];
  url: string;
}, events: string[] = []) {
  const app = Fastify({ logger: false });
  let syncCount = 0;

  await app.register(registerPaymentReminderRoutes, {
    afterReminderChange: async () => {
      events.push('sync');
      syncCount += 1;
    },
    repository,
  });

  const response = await app.inject({
    body,
    headers: body === undefined ? undefined : {
      'content-type': 'application/json',
    },
    method,
    url,
  });

  await app.close();

  return {
    response,
    syncCalls: () => syncCount,
  };
}

function reminderBody() {
  return {
    account: 'mine',
    amount: '42.00',
    amountTolerance: '5.00',
    cadence: 'quarterly',
    categoryId: 10,
    dueDay: 15,
    leadDays: 7,
    name: 'Internet',
    source: 'manual',
    startDate: '2026-07-15',
    subcategoryId: null,
  };
}

function reminderRow(overrides: Partial<PaymentReminderRow> = {}): PaymentReminderRow {
  return {
    account: 'mine',
    active: true,
    amount: '42.00',
    amount_tolerance: '5.00',
    cadence: 'quarterly',
    category: 'Utilities',
    category_id: 10,
    created_at: '2026-07-01T00:00:00.000Z',
    due_day: 15,
    id: reminderId,
    lead_days: 7,
    match_text: null,
    name: 'Internet',
    source: 'manual',
    start_date: '2026-07-15',
    subcategory: null,
    subcategory_id: null,
    updated_at: '2026-07-01T00:00:00.000Z',
    ...overrides,
  };
}

function occurrenceRow(
  status: PaymentOccurrenceOverrideRow['status'],
): PaymentOccurrenceOverrideRow {
  return {
    due_date: '2026-07-15',
    id: '00000000-0000-4000-8000-000000000002',
    matched_expense_id: null,
    paid_at: status === 'paid' ? '2026-07-15T00:00:00.000Z' : null,
    payment_reminder_id: reminderId,
    skipped_at: status === 'skipped' ? '2026-07-15T00:00:00.000Z' : null,
    status,
  };
}
