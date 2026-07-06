import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { PaymentReminderOccurrence } from '@finance/shared';
import {
  planGoogleCalendarSync,
  toGoogleCalendarEvent,
  toGoogleEventId,
} from './googleEvents.js';
import type { CalendarEventSyncRow } from './types.js';

describe('Google Calendar event mapping', () => {
  it('maps an open occurrence to a private all-day Google event', () => {
    const event = toGoogleCalendarEvent(occurrence({ cadence: 'quarterly' }));

    assert.equal(event.id, toGoogleEventId('reminder-1:2026-07-15'));
    assert.equal(event.summary, 'Internet (42.00€)');
    assert.equal(event.startDate, '2026-07-15');
    assert.equal(event.endDate, '2026-07-16');
    assert.equal(event.remindersMinutes, 7 * 24 * 60);
    assert.equal(event.extendedProperties.reminderId, 'reminder-1');
    assert.equal(event.extendedProperties.dueDate, '2026-07-15');
    assert.equal(event.extendedProperties.source, 'finhunter');
    assert.equal(event.extendedProperties.payloadHash, event.payloadHash);
    assert.match(event.description, /Category: Utilities/);
  });

  it('plans inserts, updates, deletions, and skips', () => {
    const unchangedOccurrence = occurrence({
      cadence: 'quarterly',
      dueDate: '2026-07-15',
      reminderId: 'unchanged',
    });
    const changedOccurrence = occurrence({
      amount: '45.00',
      cadence: 'annually',
      dueDate: '2026-07-16',
      reminderId: 'changed',
    });
    const unchangedEvent = toGoogleCalendarEvent(unchangedOccurrence);
    const changedEvent = toGoogleCalendarEvent(changedOccurrence);
    const plan = planGoogleCalendarSync({
      existingSyncs: [
        syncRow({
          google_event_id: unchangedEvent.id,
          occurrence_key: 'unchanged:2026-07-15',
          payload_hash: unchangedEvent.payloadHash,
          payment_reminder_id: 'unchanged',
        }),
        syncRow({
          due_date: '2026-07-16',
          google_event_id: changedEvent.id,
          occurrence_key: 'changed:2026-07-16',
          payload_hash: 'old-hash',
          payment_reminder_id: 'changed',
        }),
        syncRow({
          due_date: '2026-07-17',
          google_event_id: 'stale-event',
          occurrence_key: 'stale:2026-07-17',
          payment_reminder_id: 'stale',
        }),
      ],
      occurrences: [
        unchangedOccurrence,
        changedOccurrence,
        occurrence({
          cadence: 'oneTime',
          dueDate: '2026-07-18',
          reminderId: 'new',
        }),
        occurrence({
          cadence: 'quarterly',
          dueDate: '2026-07-19',
          reminderId: 'paid',
          state: 'paid',
        }),
      ],
    });

    assert.equal(plan.insert.length, 1);
    assert.equal(plan.update.length, 1);
    assert.equal(plan.delete.length, 1);
    assert.equal(plan.skip.length, 1);
    assert.equal(plan.insert[0]?.occurrence.reminderId, 'new');
    assert.equal(plan.update[0]?.occurrence.reminderId, 'changed');
    assert.equal(plan.delete[0]?.syncRow.google_event_id, 'stale-event');
    assert.equal(plan.skip[0]?.syncRow.google_event_id, unchangedEvent.id);
  });

  it('excludes monthly occurrences and deletes existing monthly sync rows', () => {
    const monthlyOccurrence = occurrence({
      cadence: 'monthly',
      dueDate: '2026-07-15',
      reminderId: 'monthly',
    });
    const quarterlyOccurrence = occurrence({
      cadence: 'quarterly',
      dueDate: '2026-07-16',
      reminderId: 'quarterly',
    });
    const quarterlyEvent = toGoogleCalendarEvent(quarterlyOccurrence);
    const plan = planGoogleCalendarSync({
      existingSyncs: [
        syncRow({
          due_date: monthlyOccurrence.dueDate,
          google_event_id: 'monthly-event',
          occurrence_key: 'monthly:2026-07-15',
          payment_reminder_id: 'monthly',
        }),
        syncRow({
          due_date: quarterlyOccurrence.dueDate,
          google_event_id: quarterlyEvent.id,
          occurrence_key: 'quarterly:2026-07-16',
          payload_hash: quarterlyEvent.payloadHash,
          payment_reminder_id: 'quarterly',
        }),
      ],
      occurrences: [monthlyOccurrence, quarterlyOccurrence],
    });

    assert.equal(plan.insert.length, 0);
    assert.equal(plan.update.length, 0);
    assert.equal(plan.skip.length, 1);
    assert.equal(plan.delete.length, 1);
    assert.equal(plan.delete[0]?.syncRow.google_event_id, 'monthly-event');
  });
});

function occurrence(
  overrides: Partial<PaymentReminderOccurrence> = {},
): PaymentReminderOccurrence {
  return {
    account: 'mine',
    amount: '42.00',
    amountTolerance: '5.00',
    cadence: 'monthly',
    category: 'Utilities',
    categoryId: 10,
    dueDate: '2026-07-15',
    id: null,
    leadDays: 7,
    matchText: 'internet',
    matchedExpenseId: null,
    paidAt: null,
    reminderId: 'reminder-1',
    reminderName: 'Internet',
    skippedAt: null,
    state: 'upcoming',
    subcategory: null,
    subcategoryId: null,
    ...overrides,
  };
}

function syncRow(
  overrides: Partial<CalendarEventSyncRow> = {},
): CalendarEventSyncRow {
  return {
    created_at: '2026-07-01T00:00:00.000Z',
    deleted_at: null,
    due_date: '2026-07-15',
    google_event_id: 'google-event',
    id: 'sync-1',
    integration_id: 'integration-1',
    last_synced_at: '2026-07-01T00:00:00.000Z',
    occurrence_key: 'reminder-1:2026-07-15',
    payload_hash: 'hash',
    payment_reminder_id: 'reminder-1',
    updated_at: '2026-07-01T00:00:00.000Z',
    ...overrides,
  };
}
