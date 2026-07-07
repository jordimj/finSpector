import type { CockpitSubjectSummary } from '@finance/shared';
import { isExpenseOnlySubject } from './cockpitSubjects';

export type SubjectMetricModel = {
  label: string;
  tone: 'green' | 'ink' | 'lavender' | 'rose';
  value: string;
};

export function getSubjectCardMetrics(
  subject: CockpitSubjectSummary,
): SubjectMetricModel[] {
  if (isExpenseOnlySubject(subject.slug)) {
    return [
      {
        label: 'Expenses',
        tone: 'lavender',
        value: subject.totals.expenses,
      },
    ];
  }

  if (subject.slug === 'salaries') {
    return [
      {
        label: 'Income',
        tone: 'green',
        value: subject.totals.income,
      },
    ];
  }

  const net = Number(subject.totals.net);

  return [
    {
      label: 'Expenses',
      tone: 'lavender',
      value: subject.totals.expenses,
    },
    {
      label: 'Income',
      tone: 'green',
      value: subject.totals.income,
    },
    {
      label: 'Net',
      tone: net >= 0 ? 'green' : 'rose',
      value: subject.totals.net,
    },
  ];
}

export function getMetricToneClass(tone: SubjectMetricModel['tone']): string {
  const toneClass = {
    green: 'text-accent-green',
    ink: 'text-ink',
    lavender: 'text-accent-lavender',
    rose: 'text-accent-rose',
  } satisfies Record<SubjectMetricModel['tone'], string>;

  return toneClass[tone];
}
