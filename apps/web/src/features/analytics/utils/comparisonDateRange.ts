import type { DateRangePresetKey } from '../../../components/DateRangePicker';
import type { ReportDateRange } from '../../../types';
import { formatDateKey, parseDateKey } from '../../../utils';

type BoundedReportDateRange = {
  endDate: string;
  startDate: string;
};

export function getComparisonDateRange(
  range: ReportDateRange,
  presetKey: DateRangePresetKey | null,
): ReportDateRange | undefined {
  if (range.startDate === undefined || range.endDate === undefined) {
    return undefined;
  }

  const boundedRange = {
    startDate: range.startDate,
    endDate: range.endDate,
  };

  switch (presetKey) {
    case 'this-month':
    case 'last-month':
      return shiftReportDateRange(boundedRange, -1);
    case 'last-6-months':
      return shiftReportDateRange(boundedRange, -6);
    case 'last-12-months':
      return shiftReportDateRange(boundedRange, -12);
    case 'this-year':
    case 'last-year':
      return shiftReportDateRange(boundedRange, -12);
    case 'all-time':
      return undefined;
    case 'today':
    case 'last-30-days':
    case null:
      return getPreviousEqualLengthRange(boundedRange);
  }
}

function shiftReportDateRange(
  range: BoundedReportDateRange,
  monthOffset: number,
): ReportDateRange {
  return {
    startDate: shiftDateKeyByMonths(range.startDate, monthOffset),
    endDate: shiftDateKeyByMonths(range.endDate, monthOffset),
  };
}

function shiftDateKeyByMonths(dateKey: string, monthOffset: number): string {
  const date = parseDateKey(dateKey);
  const targetYear = date.getFullYear();
  const targetMonth = date.getMonth() + monthOffset;
  const targetMonthLastDay = new Date(targetYear, targetMonth + 1, 0).getDate();
  const targetDay = Math.min(date.getDate(), targetMonthLastDay);

  return formatDateKey(new Date(targetYear, targetMonth, targetDay));
}

function getPreviousEqualLengthRange(
  range: BoundedReportDateRange,
): ReportDateRange | undefined {
  const start = parseDateKey(range.startDate);
  const end = parseDateKey(range.endDate);
  const durationDays = getDayIndex(end) - getDayIndex(start) + 1;

  if (durationDays < 1) {
    return undefined;
  }

  const previousEnd = addDays(start, -1);
  const previousStart = addDays(previousEnd, -(durationDays - 1));

  return {
    startDate: formatDateKey(previousStart),
    endDate: formatDateKey(previousEnd),
  };
}

function addDays(date: Date, dayOffset: number): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() + dayOffset,
  );
}

function getDayIndex(date: Date): number {
  return Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) /
      (24 * 60 * 60 * 1000),
  );
}
