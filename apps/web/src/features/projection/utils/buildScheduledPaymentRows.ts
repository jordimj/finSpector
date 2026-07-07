import type { ProjectionMonth } from '../hooks/useProjection';

type ScheduledPaymentOccurrence = {
  amount: string;
  dueDate: string;
  state: string;
};

export type ScheduledPaymentRow = {
  amount: number;
  count: number;
  label: string;
  month: string;
};

type BuildScheduledPaymentRowsOptions = {
  months: ProjectionMonth[];
  occurrences: ScheduledPaymentOccurrence[];
};

export function buildScheduledPaymentRows({
  months,
  occurrences,
}: BuildScheduledPaymentRowsOptions): ScheduledPaymentRow[] {
  const monthLabels = new Map(months.map((month) => [month.month, month.label]));
  const grouped = new Map<
    string,
    {
      amount: number;
      count: number;
      label: string;
    }
  >();

  for (const occurrence of occurrences) {
    if (occurrence.state === 'paid' || occurrence.state === 'skipped') {
      continue;
    }

    const monthKey = occurrence.dueDate.slice(0, 7);
    const label = monthLabels.get(monthKey);

    if (label === undefined) {
      continue;
    }

    const current = grouped.get(monthKey) ?? {
      amount: 0,
      count: 0,
      label,
    };

    grouped.set(monthKey, {
      amount: current.amount + Number(occurrence.amount),
      count: current.count + 1,
      label: current.label,
    });
  }

  return Array.from(grouped.entries())
    .map(([month, row]) => ({
      month,
      ...row,
    }))
    .sort((left, right) => left.month.localeCompare(right.month));
}
