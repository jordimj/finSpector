import type {
  ProjectionExpenseExclusion,
  ProjectionIncomeSource,
} from '../hooks/useProjection';

export function getExclusionLabel(
  exclusion: ProjectionExpenseExclusion,
): string {
  return exclusion.subcategoryName === undefined
    ? exclusion.categoryName
    : `${exclusion.categoryName} / ${exclusion.subcategoryName}`;
}

export function getIncomeSourceRule(source: ProjectionIncomeSource): string {
  if (source.excludedMonthNumbers.length === 0) {
    return 'Every projected month';
  }

  return `Every month except ${source.excludedMonthNumbers
    .map(formatMonthNumber)
    .join(', ')}`;
}

export function toNumberInputValue(value: string): number {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : 0;
}

export function getCurrentMonthKey(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');

  return `${now.getFullYear()}-${month}`;
}

function formatMonthNumber(monthNumber: number): string {
  return new Intl.DateTimeFormat(undefined, { month: 'short' }).format(
    new Date(2024, monthNumber - 1, 1),
  );
}
