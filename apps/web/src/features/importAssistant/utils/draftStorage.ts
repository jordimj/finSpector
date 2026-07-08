import type {
  ExportCsvMode,
  ExportCsvPeriod,
  ImportReviewDraft,
  ImportReviewRow,
} from '../types';
import {
  allExportCsvPeriod,
  exportMonthPattern,
  getReviewRowMonth,
  isExportCsvMode,
} from './csvExport';
import { normalizeReviewText } from './reviewRows';

export const importReviewDraftVersion = 1;
export const importReviewDraftStorageKey =
  'finance.importAssistant.reviewDraft.v1';

export function loadImportReviewDraft(): ImportReviewDraft | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const storedValue = window.localStorage.getItem(importReviewDraftStorageKey);

    if (storedValue === null) {
      return null;
    }

    const draft = normalizeImportReviewDraft(JSON.parse(storedValue));

    if (draft === null) {
      clearImportReviewDraft();
    }

    return draft;
  } catch {
    clearImportReviewDraft();
    return null;
  }
}

export function saveImportReviewDraft({
  exportCsvMode,
  exportCsvPeriod,
  rows,
  sourceFileName,
}: {
  exportCsvMode: ExportCsvMode;
  exportCsvPeriod: ExportCsvPeriod;
  rows: ImportReviewRow[];
  sourceFileName: string;
}): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const updatedAt = new Date().toISOString();
  const draft: ImportReviewDraft = {
    exportCsvMode,
    exportCsvPeriod,
    rows,
    sourceFileName,
    updatedAt,
    version: importReviewDraftVersion,
  };

  try {
    window.localStorage.setItem(
      importReviewDraftStorageKey,
      JSON.stringify(draft),
    );

    return updatedAt;
  } catch {
    return null;
  }
}

export function clearImportReviewDraft() {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.removeItem(importReviewDraftStorageKey);
  } catch {
    // localStorage can be unavailable in private or restricted browser modes.
  }
}

export function formatDraftSavedAt(value: string): string {
  const savedAt = new Date(value);

  if (!Number.isFinite(savedAt.getTime())) {
    return 'locally';
  }

  return savedAt.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function normalizeImportReviewDraft(
  value: unknown,
): ImportReviewDraft | null {
  if (!isRecord(value) || value.version !== importReviewDraftVersion) {
    return null;
  }

  const sourceFileName = toTrimmedText(value.sourceFileName);
  const rows = normalizeImportReviewRows(value.rows);

  if (sourceFileName.length === 0 || rows.length === 0) {
    return null;
  }

  return {
    exportCsvMode: isExportCsvMode(value.exportCsvMode)
      ? value.exportCsvMode
      : 'all',
    exportCsvPeriod: normalizeExportCsvPeriod(value.exportCsvPeriod, rows),
    rows,
    sourceFileName,
    updatedAt: toValidIsoDate(value.updatedAt) ?? new Date().toISOString(),
    version: importReviewDraftVersion,
  };
}

function normalizeImportReviewRows(value: unknown): ImportReviewRow[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    const row = normalizeImportReviewRow(item);

    return row === null ? [] : [row];
  });
}

function normalizeImportReviewRow(value: unknown): ImportReviewRow | null {
  if (!isRecord(value)) {
    return null;
  }

  const date = toText(value.date);
  const description = toText(value.description);
  const amount = toText(value.amount);
  const type = value.type;

  if (
    date.trim().length === 0 ||
    amount.trim().length === 0 ||
    (type !== 'expense' && type !== 'income')
  ) {
    return null;
  }

  const concept = toOptionalText(value.concept);
  const originalDescription = toText(value.originalDescription) || description;
  const originalSuggestedCategory = toNullableText(
    value.originalSuggestedCategory,
  );
  const originalSuggestedSubcategory = toNullableText(
    value.originalSuggestedSubcategory,
  );
  const originalReviewKey =
    toOptionalText(value.originalReviewKey) ??
    `${normalizeReviewText(concept ?? '')}::${normalizeReviewText(
      originalDescription,
    )}`;

  return {
    amount,
    confidence: clampConfidence(value.confidence),
    date,
    description,
    matchedAmount: toNullableText(value.matchedAmount),
    matchedDate: toNullableText(value.matchedDate),
    matchedDescription: toNullableText(value.matchedDescription),
    matchReason: toText(value.matchReason),
    originalDescription,
    originalReviewKey,
    originalSuggestedCategory,
    originalSuggestedSubcategory,
    rawText: toText(value.rawText),
    skipped: value.skipped === true ? true : undefined,
    suggestedDescription: toNullableText(value.suggestedDescription),
    suggestedCategory: toNullableText(value.suggestedCategory),
    suggestedSubcategory: toNullableText(value.suggestedSubcategory),
    reviewed: value.reviewed === true ? true : undefined,
    type,
    ...(concept === undefined ? {} : { concept }),
  };
}

function normalizeExportCsvPeriod(
  value: unknown,
  rows: ImportReviewRow[],
): ExportCsvPeriod {
  if (!isRecord(value) || value.type !== 'month') {
    return allExportCsvPeriod;
  }

  const month = toText(value.month);

  if (!exportMonthPattern.test(month)) {
    return allExportCsvPeriod;
  }

  const hasMonth = rows.some((row) => getReviewRowMonth(row) === month);

  return hasMonth ? { type: 'month', month } : allExportCsvPeriod;
}

function clampConfidence(value: unknown): number {
  const confidence = Number(value);

  if (!Number.isFinite(confidence)) {
    return 0;
  }

  return Math.min(100, Math.max(0, Math.round(confidence)));
}

function toValidIsoDate(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  return Number.isFinite(new Date(value).getTime()) ? value : null;
}

function toText(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function toOptionalText(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined;
  }

  return value.length > 0 ? value : undefined;
}

function toTrimmedText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function toNullableText(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const text = value.trim();

  return text.length > 0 ? text : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
