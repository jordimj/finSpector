import { useMemo } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type {
  ApplyMatchingRowsScope,
  ExportCsvMode,
  ExportCsvPeriod,
  ImportPreviewRow,
  ImportReviewRow,
} from '../types';
import { isReviewRowFiltered } from '../utils/csvExport';
import { resetImportReviewRow } from '../utils/reviewRows';

export function useImportReviewRows({
  applyMatchingRowsScope,
  exportCsvMode,
  exportCsvPeriod,
  rows,
  setRows,
}: {
  applyMatchingRowsScope: ApplyMatchingRowsScope;
  exportCsvMode: ExportCsvMode;
  exportCsvPeriod: ExportCsvPeriod;
  rows: ImportReviewRow[];
  setRows: Dispatch<SetStateAction<ImportReviewRow[]>>;
}) {
  const matchingRowCounts = useMemo(() => {
    const totalCounts = new Map<string, number>();
    const filteredCounts = new Map<string, number>();

    for (const row of rows) {
      const key = row.originalReviewKey;
      totalCounts.set(key, (totalCounts.get(key) ?? 0) + 1);

      if (isReviewRowFiltered(row, exportCsvMode, exportCsvPeriod)) {
        filteredCounts.set(key, (filteredCounts.get(key) ?? 0) + 1);
      }
    }

    return rows.map((row) => ({
      filtered: filteredCounts.get(row.originalReviewKey) ?? 0,
      total: totalCounts.get(row.originalReviewKey) ?? 1,
    }));
  }, [exportCsvMode, exportCsvPeriod, rows]);

  function updateReviewRows(index: number, changes: Partial<ImportPreviewRow>) {
    setRows((currentRows) => {
      const targetRow = currentRows[index];

      if (targetRow === undefined) {
        return currentRows;
      }

      const targetKey = targetRow.originalReviewKey;

      return currentRows.map((row, rowIndex) => {
        const shouldUpdate = shouldApplyToRow({
          applyMatchingRowsScope,
          exportCsvMode,
          exportCsvPeriod,
          row,
          rowIndex,
          targetIndex: index,
          targetKey,
        });

        return shouldUpdate ? { ...row, ...changes, reviewed: true } : row;
      });
    });
  }

  function resetReviewRows(index: number) {
    setRows((currentRows) => {
      const targetRow = currentRows[index];

      if (targetRow === undefined) {
        return currentRows;
      }

      const targetKey = targetRow.originalReviewKey;

      return currentRows.map((row, rowIndex) => {
        const shouldReset = shouldApplyToRow({
          applyMatchingRowsScope,
          exportCsvMode,
          exportCsvPeriod,
          row,
          rowIndex,
          targetIndex: index,
          targetKey,
        });

        return shouldReset ? resetImportReviewRow(row) : row;
      });
    });
  }

  function toggleSkippedRow(index: number) {
    setRows((currentRows) =>
      currentRows.map((row, rowIndex) =>
        rowIndex === index ? { ...row, skipped: row.skipped !== true } : row,
      ),
    );
  }

  function markReviewedRow(index: number) {
    setRows((currentRows) =>
      currentRows.map((row, rowIndex) =>
        rowIndex === index ? { ...row, reviewed: true } : row,
      ),
    );
  }

  return {
    markReviewedRow,
    matchingRowCounts,
    resetReviewRows,
    toggleSkippedRow,
    updateReviewRows,
  };
}

function shouldApplyToRow({
  applyMatchingRowsScope,
  exportCsvMode,
  exportCsvPeriod,
  row,
  rowIndex,
  targetIndex,
  targetKey,
}: {
  applyMatchingRowsScope: ApplyMatchingRowsScope;
  exportCsvMode: ExportCsvMode;
  exportCsvPeriod: ExportCsvPeriod;
  row: ImportReviewRow;
  rowIndex: number;
  targetIndex: number;
  targetKey: string;
}): boolean {
  if (applyMatchingRowsScope === 'none') {
    return rowIndex === targetIndex;
  }

  if (row.originalReviewKey !== targetKey) {
    return false;
  }

  return (
    applyMatchingRowsScope === 'all' ||
    isReviewRowFiltered(row, exportCsvMode, exportCsvPeriod)
  );
}
