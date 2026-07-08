import type {
  ExportCsvMode,
  ExportCsvPeriod,
  ExportCsvRow,
  ExportMonthOption,
  ImportReviewRow,
} from '../types';

export const allExportCsvPeriod: ExportCsvPeriod = { type: 'all' };
export const exportMonthPattern = /^\d{4}-\d{2}$/;

const csvHeaders: Array<keyof ExportCsvRow> = [
  'date',
  'category',
  'subcategory',
  'description',
  'amount',
  'type',
  'bankConcept',
];

export const exportCsvModeOptions: Array<{
  value: ExportCsvMode;
  label: string;
}> = [
  {
    value: 'all',
    label: 'All rows',
  },
  {
    value: 'expense',
    label: 'Expenses only',
  },
  {
    value: 'income',
    label: 'Income only',
  },
];

export function buildExportMonthOptions(
  rows: ImportReviewRow[],
): ExportMonthOption[] {
  const countsByMonth = new Map<string, number>();

  for (const row of rows) {
    const month = getReviewRowMonth(row);

    if (month === null) {
      continue;
    }

    countsByMonth.set(month, (countsByMonth.get(month) ?? 0) + 1);
  }

  return Array.from(countsByMonth.entries())
    .sort(([firstMonth], [secondMonth]) =>
      firstMonth.localeCompare(secondMonth),
    )
    .map(([month, rowCount]) => ({
      label: `${formatExportMonth(month)} (${rowCount} ${
        rowCount === 1 ? 'row' : 'rows'
      })`,
      month,
    }));
}

export function exportCsvPeriodToSelectValue(
  period: ExportCsvPeriod,
): string {
  return period.type === 'all' ? 'all' : `month:${period.month}`;
}

export function exportCsvPeriodFromSelectValue(
  value: string,
): ExportCsvPeriod {
  if (!value.startsWith('month:')) {
    return allExportCsvPeriod;
  }

  const month = value.slice('month:'.length);

  return exportMonthPattern.test(month)
    ? {
        month,
        type: 'month',
      }
    : allExportCsvPeriod;
}

export function getReviewRowMonth(row: ImportReviewRow): string | null {
  const trimmedDate = row.date.trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmedDate)) {
    return null;
  }

  return trimmedDate.slice(0, 7);
}

export function isExportedReviewRow(
  row: ImportReviewRow,
  exportMode: ExportCsvMode,
  exportPeriod: ExportCsvPeriod,
): boolean {
  return (
    row.skipped !== true &&
    (exportMode === 'all' || row.type === exportMode) &&
    matchesExportPeriod(row, exportPeriod)
  );
}

export function toReviewCsv(
  rows: ImportReviewRow[],
  exportMode: ExportCsvMode,
  exportPeriod: ExportCsvPeriod,
): string {
  const exportableRows = rows
    .filter((row) => isExportedReviewRow(row, exportMode, exportPeriod))
    .reverse();

  return [
    csvHeaders.join(';'),
    ...exportableRows.map((row) => {
      const exportRow = toExportCsvRow(row);

      return csvHeaders
        .map((header) => escapeCsvValue(exportRow[header]))
        .join(';');
    }),
  ].join('\n');
}

export function buildDownloadName(
  fileName: string | null | undefined,
  exportMode: ExportCsvMode,
  exportPeriod: ExportCsvPeriod,
): string {
  const baseName =
    fileName?.replace(/\.(pdf|xls|xlsx|xlsm)$/i, '') || 'import-preview';
  const modeSuffix =
    exportMode === 'all' ? 'review' : `${exportMode}-review`;
  const suffix =
    exportPeriod.type === 'all'
      ? modeSuffix
      : `${exportPeriod.month}-${modeSuffix}`;

  return `${baseName}-${suffix}.csv`;
}

export function isExportCsvMode(value: unknown): value is ExportCsvMode {
  return value === 'all' || value === 'expense' || value === 'income';
}

function matchesExportPeriod(
  row: ImportReviewRow,
  period: ExportCsvPeriod,
): boolean {
  if (period.type === 'all') {
    return true;
  }

  return getReviewRowMonth(row) === period.month;
}

function formatExportMonth(month: string): string {
  const date = new Date(`${month}-01T00:00:00Z`);

  if (!Number.isFinite(date.getTime())) {
    return month;
  }

  return date.toLocaleString(undefined, {
    month: 'long',
    timeZone: 'UTC',
    year: 'numeric',
  });
}

function toExportCsvRow(row: ImportReviewRow): ExportCsvRow {
  return {
    date: row.date,
    category: row.suggestedCategory,
    subcategory: row.suggestedSubcategory,
    description: row.description,
    amount: formatExportAmount(row.amount),
    type: row.type,
    bankConcept: row.originalDescription,
  };
}

function formatExportAmount(amount: string): string {
  const cleanAmount = amount
    .trim()
    .replace(/\s*(eur|€)\s*$/i, '')
    .replace(/\s+/g, '');
  const decimalSeparatorIndex = Math.max(
    cleanAmount.lastIndexOf(','),
    cleanAmount.lastIndexOf('.'),
  );
  const normalizedAmount =
    decimalSeparatorIndex === -1
      ? Number(cleanAmount)
      : Number(
          `${cleanAmount
            .slice(0, decimalSeparatorIndex)
            .replace(/[,.]/g, '')}.${cleanAmount.slice(
            decimalSeparatorIndex + 1,
          )}`,
        );

  if (!Number.isFinite(normalizedAmount)) {
    return `${cleanAmount.replace('.', ',')} €`;
  }

  return `${normalizedAmount.toFixed(2).replace('.', ',')} €`;
}

function escapeCsvValue(value: ExportCsvRow[keyof ExportCsvRow]): string {
  const text = value === null || value === undefined ? '' : String(value);

  if (!/[;"\n\r]/.test(text)) {
    return text;
  }

  return `"${text.split('"').join('""')}"`;
}
