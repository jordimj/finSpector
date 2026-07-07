import type {
  CockpitInsightMetricTone,
  CockpitInsightTimelineItem,
} from '@finance/shared';
import {
  formatCurrency,
  formatDateRange,
  formatTransactionDate,
} from '../../../utils';

export function getInsightMetricToneClass(
  tone: CockpitInsightMetricTone,
): string {
  const toneClass = {
    amber: 'text-accent-amber',
    cyan: 'text-accent-cyan',
    green: 'text-accent-green',
    lavender: 'text-accent-lavender',
    rose: 'text-accent-rose',
  } satisfies Record<CockpitInsightMetricTone, string>;

  return toneClass[tone];
}

export function formatInsightMetricValue(value: string): string {
  const amount = Number(value);

  if (!Number.isFinite(amount) || !value.includes('.')) {
    return value;
  }

  return formatCurrency(amount);
}

export function formatTimelinePeriod(item: CockpitInsightTimelineItem): string {
  if (item.startDate === null || item.endDate === null) {
    return item.detail;
  }

  if (item.startDate === item.endDate) {
    return formatTransactionDate(item.startDate, { includeYear: true });
  }

  return formatDateRange(item.startDate, item.endDate, { includeYear: true });
}
