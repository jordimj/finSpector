import type { PaymentOccurrenceState } from '@finance/shared';

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

export function getOccurrenceStateClass(
  state: PaymentOccurrenceState,
): string {
  const baseClass =
    'inline-flex h-7 items-center justify-center rounded-full px-3 text-xs font-bold uppercase tracking-[0.12em]';
  const toneClass = {
    dueSoon: 'bg-accent-amber/15 text-accent-amber',
    overdue: 'bg-accent-rose/15 text-accent-rose',
    paid: 'bg-accent-green/15 text-accent-green',
    skipped: 'bg-muted/15 text-muted-strong',
    upcoming: 'bg-accent-cyan/15 text-accent-cyan',
  } satisfies Record<PaymentOccurrenceState, string>;

  return `${baseClass} ${toneClass[state]}`;
}
