import type {
  PaymentCadence,
  PaymentOccurrenceState,
  PaymentReminderOccurrence,
} from '@finance/shared';

export const stateStyles = {
  dueSoon: 'bg-accent-lavender/15 text-accent-lavender',
  overdue: 'bg-accent-rose/15 text-accent-rose',
  paid: 'bg-accent-green/15 text-accent-green',
  skipped: 'bg-panel-raised text-muted-strong',
  upcoming: 'bg-accent-cyan/15 text-accent-cyan',
} satisfies Record<PaymentOccurrenceState, string>;

export function isOpenOccurrence(
  occurrence: PaymentReminderOccurrence,
): boolean {
  return (
    occurrence.state === 'overdue' ||
    occurrence.state === 'dueSoon' ||
    occurrence.state === 'upcoming'
  );
}

export function formatOccurrenceState(state: PaymentOccurrenceState): string {
  const labels = {
    dueSoon: 'Due soon',
    overdue: 'Overdue',
    paid: 'Paid',
    skipped: 'Skipped',
    upcoming: 'Upcoming',
  } satisfies Record<PaymentOccurrenceState, string>;

  return labels[state];
}

export function formatCadenceLabel(cadence: PaymentCadence): string {
  const labels = {
    annually: 'Annual',
    monthly: 'Monthly',
    oneTime: 'One time',
    quarterly: 'Quarterly',
  } satisfies Record<PaymentCadence, string>;

  return labels[cadence];
}
