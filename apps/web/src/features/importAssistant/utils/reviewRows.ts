import type {
  ImportPreviewRow,
  ImportReviewRow,
} from '../types';

export function toImportReviewRow(row: ImportPreviewRow): ImportReviewRow {
  const suggestedDescription =
    row.suggestedDescription === null
      ? row.description
      : row.suggestedDescription;

  return {
    ...row,
    description: suggestedDescription,
    originalDescription: row.description,
    originalSuggestedCategory: row.suggestedCategory,
    originalSuggestedSubcategory: row.suggestedSubcategory,
    originalReviewKey: buildReviewRowKey(row),
  };
}

export function resetImportReviewRow(row: ImportReviewRow): ImportReviewRow {
  return {
    ...row,
    description: row.suggestedDescription ?? row.originalDescription,
    suggestedCategory: row.originalSuggestedCategory,
    suggestedSubcategory: row.originalSuggestedSubcategory,
    reviewed: undefined,
  };
}

export function hasImportReviewChanges(row: ImportReviewRow): boolean {
  const baselineDescription =
    row.suggestedDescription ?? row.originalDescription;

  return (
    row.description !== baselineDescription ||
    row.suggestedCategory !== row.originalSuggestedCategory ||
    row.suggestedSubcategory !== row.originalSuggestedSubcategory
  );
}

export function getConfidenceBadgeClassName(confidence: number): string {
  if (confidence >= 70) {
    return 'bg-accent-green/15 text-accent-green';
  }

  if (confidence >= 55) {
    return 'bg-accent-amber/15 text-accent-amber';
  }

  return 'bg-panel-raised text-muted';
}

export function formatCategorySuggestion(
  category: string | null,
  subcategory: string | null,
): string {
  if (category === null) {
    return 'None';
  }

  return subcategory === null ? category : `${category} / ${subcategory}`;
}

export function filterSuggestionOptions(
  options: string[],
  value: string,
): string[] {
  const normalizedValue = normalizeReviewText(value);
  const uniqueOptions = Array.from(new Set(options));

  if (normalizedValue.length === 0) {
    return uniqueOptions;
  }

  return uniqueOptions.filter((option) =>
    normalizeReviewText(option).includes(normalizedValue),
  );
}

export function buildReviewRowKey(row: ImportPreviewRow): string {
  return `${normalizeReviewText(row.concept ?? '')}::${normalizeReviewText(
    row.description,
  )}`;
}

export function normalizeReviewText(value: string): string {
  return value.replace(/\s+/g, ' ').trim().toLocaleLowerCase();
}
