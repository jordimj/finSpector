import { useMemo, useState } from 'react';
import type {
  ExportCsvMode,
  ExportCsvPeriod,
  ImportReviewDraft,
  ImportReviewRow,
} from '../types';
import {
  allExportCsvPeriod,
  buildDownloadName,
  buildExportMonthOptions,
  isExportedReviewRow,
  toReviewCsv,
} from '../utils/csvExport';

export function useImportCsvExport({
  initialDraft,
  rows,
  sourceFileName,
}: {
  initialDraft: ImportReviewDraft | null;
  rows: ImportReviewRow[];
  sourceFileName: string | null;
}) {
  const [exportCsvMode, setExportCsvMode] = useState<ExportCsvMode>(
    initialDraft?.exportCsvMode ?? 'all',
  );
  const [exportCsvPeriod, setExportCsvPeriod] = useState<ExportCsvPeriod>(
    initialDraft?.exportCsvPeriod ?? allExportCsvPeriod,
  );
  const exportMonthOptions = useMemo(
    () => buildExportMonthOptions(rows),
    [rows],
  );
  const exportableRowCount = useMemo(
    () =>
      rows.filter((row) =>
        isExportedReviewRow(row, exportCsvMode, exportCsvPeriod),
      ).length,
    [exportCsvMode, exportCsvPeriod, rows],
  );

  function handleDownloadCsv() {
    const csv = toReviewCsv(rows, exportCsvMode, exportCsvPeriod);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = buildDownloadName(
      sourceFileName,
      exportCsvMode,
      exportCsvPeriod,
    );
    link.click();
    URL.revokeObjectURL(url);
  }

  return {
    exportCsvMode,
    exportCsvPeriod,
    exportMonthOptions,
    exportableRowCount,
    handleDownloadCsv,
    setExportCsvMode,
    setExportCsvPeriod,
  };
}
