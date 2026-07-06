import {
  DEFAULT_PAYMENT_REMINDER_HORIZON_DAYS,
  type ExpenseAccount,
  type PaymentReminderOccurrence,
} from '@finance/shared';
import { overdueLookbackDays } from './constants.js';
import { addDays, formatDateKey } from './date.js';
import {
  compareOccurrences,
  generatePaymentReminderOccurrences,
  occurrenceKey,
} from './occurrences.js';
import {
  findMatchingExpense,
  getOccurrenceOverrides,
  getPaymentReminderRows,
  upsertOccurrenceStatus,
} from './repository.js';
import {
  toOccurrenceReminder,
  toOccurrenceResponse,
} from './serializers.js';

export type MaterializedPaymentOccurrences = {
  endDate: string;
  horizonDays: number;
  occurrences: PaymentReminderOccurrence[];
  startDate: string;
  today: string;
};

export async function materializePaymentReminderOccurrences({
  account,
  days = DEFAULT_PAYMENT_REMINDER_HORIZON_DAYS,
  today = formatDateKey(new Date()),
}: {
  account?: ExpenseAccount;
  days?: number;
  today?: string;
} = {}): Promise<MaterializedPaymentOccurrences> {
  const startDate = addDays(today, -overdueLookbackDays);
  const endDate = addDays(today, days);
  const reminders = await getPaymentReminderRows(account);
  const generated = reminders.flatMap((reminder) =>
    generatePaymentReminderOccurrences(
      toOccurrenceReminder(reminder),
      startDate,
      endDate,
      today,
    ),
  );
  const overrides = await getOccurrenceOverrides(
    reminders.map((reminder) => reminder.id),
    startDate,
    endDate,
  );
  const occurrences: PaymentReminderOccurrence[] = [];

  for (const occurrence of generated) {
    const override = overrides.get(occurrenceKey(occurrence));

    if (override !== undefined) {
      occurrences.push(toOccurrenceResponse(occurrence, override));
      continue;
    }

    const matchedExpense = await findMatchingExpense(occurrence);

    if (matchedExpense === undefined) {
      occurrences.push(toOccurrenceResponse(occurrence));
      continue;
    }

    const paidOverride = await upsertOccurrenceStatus({
      dueDate: occurrence.dueDate,
      matchedExpenseId: matchedExpense.id,
      paymentReminderId: occurrence.reminderId,
      status: 'paid',
    });

    occurrences.push(toOccurrenceResponse(occurrence, paidOverride));
  }

  return {
    endDate,
    horizonDays: days,
    occurrences: occurrences.sort(compareOccurrences),
    startDate,
    today,
  };
}
