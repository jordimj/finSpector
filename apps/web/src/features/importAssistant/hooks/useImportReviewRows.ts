import { useMemo } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type {
  ImportPreviewRow,
  ImportReviewRow,
} from '../types';
import { resetImportReviewRow } from '../utils/reviewRows';

export function useImportReviewRows({
  applyToMatchingRows,
  rows,
  setRows,
}: {
  applyToMatchingRows: boolean;
  rows: ImportReviewRow[];
  setRows: Dispatch<SetStateAction<ImportReviewRow[]>>;
}) {
  const matchingRowCounts = useMemo(() => {
    const counts = new Map<string, number>();

    for (const row of rows) {
      const key = row.originalReviewKey;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    return rows.map((row) => counts.get(row.originalReviewKey) ?? 1);
  }, [rows]);

  function updateReviewRows(index: number, changes: Partial<ImportPreviewRow>) {
    setRows((currentRows) => {
      const targetRow = currentRows[index];

      if (targetRow === undefined) {
        return currentRows;
      }

      const targetKey = targetRow.originalReviewKey;

      return currentRows.map((row, rowIndex) => {
        const shouldUpdate = applyToMatchingRows
          ? row.originalReviewKey === targetKey
          : rowIndex === index;

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
        const shouldReset = applyToMatchingRows
          ? row.originalReviewKey === targetKey
          : rowIndex === index;

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
