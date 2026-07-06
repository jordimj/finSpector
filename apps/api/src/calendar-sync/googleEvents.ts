import { createHash } from 'node:crypto';
import type { PaymentReminderOccurrence } from '@finance/shared';
import { addDays } from '../payment-reminders/date.js';
import { occurrenceKey } from '../payment-reminders/occurrences.js';
import type {
  CalendarEventSyncRow,
  CalendarSyncPlan,
  GoogleCalendarEvent,
} from './types.js';

const openOccurrenceStates = new Set(['overdue', 'dueSoon', 'upcoming']);
const syncedCadences = new Set(['annually', 'oneTime', 'quarterly']);

export function isCalendarSyncOccurrence(
  occurrence: PaymentReminderOccurrence,
): boolean {
  return (
    openOccurrenceStates.has(occurrence.state) &&
    syncedCadences.has(occurrence.cadence)
  );
}

export function toGoogleCalendarEvent(
  occurrence: PaymentReminderOccurrence,
): GoogleCalendarEvent {
  const key = occurrenceKey({
    dueDate: occurrence.dueDate,
    reminderId: occurrence.reminderId,
  });
  const eventId = toGoogleEventId(key);
  const event = {
    description: buildDescription(occurrence),
    endDate: addDays(occurrence.dueDate, 1),
    extendedProperties: {
      account: occurrence.account,
      dueDate: occurrence.dueDate,
      occurrenceKey: key,
      reminderId: occurrence.reminderId,
      source: 'finhunter',
    },
    id: eventId,
    payloadHash: '',
    remindersMinutes: occurrence.leadDays * 24 * 60,
    startDate: occurrence.dueDate,
    summary: `${occurrence.reminderName} (${occurrence.amount}€)`,
  };

  const payloadHash = hashJson({
    description: event.description,
    endDate: event.endDate,
    extendedProperties: event.extendedProperties,
    remindersMinutes: event.remindersMinutes,
    startDate: event.startDate,
    summary: event.summary,
  });

  return {
    ...event,
    extendedProperties: {
      ...event.extendedProperties,
      payloadHash,
    },
    payloadHash,
  };
}

export function planGoogleCalendarSync({
  existingSyncs,
  occurrences,
}: {
  existingSyncs: CalendarEventSyncRow[];
  occurrences: PaymentReminderOccurrence[];
}): CalendarSyncPlan {
  const existingByOccurrence = new Map(
    existingSyncs
      .filter((sync) => sync.deleted_at === null)
      .map((sync) => [sync.occurrence_key, sync]),
  );
  const events = occurrences
    .filter(isCalendarSyncOccurrence)
    .map((occurrence) => ({
      event: toGoogleCalendarEvent(occurrence),
      occurrence,
    }));
  const desiredKeys = new Set(
    events.map(({ occurrence }) =>
      occurrenceKey({
        dueDate: occurrence.dueDate,
        reminderId: occurrence.reminderId,
      }),
    ),
  );
  const plan: CalendarSyncPlan = {
    delete: [],
    insert: [],
    skip: [],
    update: [],
  };

  for (const item of events) {
    const key = occurrenceKey({
      dueDate: item.occurrence.dueDate,
      reminderId: item.occurrence.reminderId,
    });
    const syncRow = existingByOccurrence.get(key);

    if (syncRow === undefined) {
      plan.insert.push({
        event: item.event,
        occurrence: item.occurrence,
        type: 'insert',
      });
      continue;
    }

    if (syncRow.payload_hash === item.event.payloadHash) {
      plan.skip.push({
        event: item.event,
        occurrence: item.occurrence,
        syncRow,
        type: 'skip',
      });
      continue;
    }

    plan.update.push({
      event: item.event,
      occurrence: item.occurrence,
      type: 'update',
    });
  }

  for (const syncRow of existingByOccurrence.values()) {
    if (desiredKeys.has(syncRow.occurrence_key)) {
      continue;
    }

    plan.delete.push({
      syncRow,
      type: 'delete',
    });
  }

  return plan;
}

export function toGoogleEventId(value: string): string {
  return `fh${createHash('sha256').update(value).digest('hex').slice(0, 32)}`;
}

function buildDescription(occurrence: PaymentReminderOccurrence): string {
  return [
    `FinHunter payment reminder`,
    `Account: ${occurrence.account}`,
    `Category: ${occurrence.category}`,
    occurrence.subcategory === null
      ? null
      : `Subcategory: ${occurrence.subcategory}`,
  ]
    .filter((line): line is string => line !== null)
    .join('\n');
}

function hashJson(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}
