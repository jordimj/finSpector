import {
  createContext,
  createElement,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { PropsWithChildren } from 'react';
import { useCategories } from '../../../hooks/useCategories';
import type { Category } from '../../../hooks/useCategories';
import type { ImportReviewRow } from '../types';
import { allExportCsvPeriod } from '../utils/csvExport';
import { isSupportedImportFile } from '../utils/filePreview';
import { toImportReviewRow } from '../utils/reviewRows';
import { useImportCsvExport } from './useImportCsvExport';
import { useImportFileDrop } from './useImportFileDrop';
import { useImportPreview } from './useImportPreview';
import { useImportReviewDraft } from './useImportReviewDraft';
import { useImportReviewRows } from './useImportReviewRows';

type ImportAssistantState = ReturnType<typeof useImportAssistantStateValue>;

const ImportAssistantStateContext = createContext<ImportAssistantState | null>(
  null,
);

export function ImportAssistantStateProvider({ children }: PropsWithChildren) {
  const state = useImportAssistantStateValue();

  return createElement(
    ImportAssistantStateContext.Provider,
    { value: state },
    children,
  );
}

export function useImportAssistantState() {
  const state = useContext(ImportAssistantStateContext);

  if (state === null) {
    throw new Error(
      'useImportAssistantState must be used within ImportAssistantStateProvider',
    );
  }

  return state;
}

function useImportAssistantStateValue() {
  const previewMutation = useImportPreview();
  const {
    clearImportReviewDraft,
    draftUpdatedAt,
    hasHydratedDraft,
    initialDraft,
    saveImportReviewDraft,
    setDraftUpdatedAt,
  } = useImportReviewDraft();
  const [sourceFileName, setSourceFileName] = useState<string | null>(
    initialDraft?.sourceFileName ?? null,
  );
  const [pendingUploadFileName, setPendingUploadFileName] = useState<
    string | null
  >(null);
  const [rows, setRows] = useState<ImportReviewRow[]>(initialDraft?.rows ?? []);
  const [textPreview, setTextPreview] = useState('');
  const [applyToMatchingRows, setApplyToMatchingRows] = useState(true);
  const {
    exportCsvMode,
    exportCsvPeriod,
    exportMonthOptions,
    exportableRowCount,
    handleDownloadCsv,
    setExportCsvMode,
    setExportCsvPeriod,
  } = useImportCsvExport({
    initialDraft,
    rows,
    sourceFileName,
  });
  const {
    markReviewedRow,
    matchingRowCounts,
    resetReviewRows,
    toggleSkippedRow,
    updateReviewRows,
  } = useImportReviewRows({
    applyToMatchingRows,
    rows,
    setRows,
  });
  const expenseCategoriesQuery = useCategories('expense');
  const incomeCategoriesQuery = useCategories('income');
  const isUploading = previewMutation.isPending;
  const displayedFileName = pendingUploadFileName ?? sourceFileName;
  const hasReviewDraft = rows.length > 0 && sourceFileName !== null;
  const errorMessage =
    previewMutation.error instanceof Error
      ? previewMutation.error.message
      : null;
  const suggestionCount = useMemo(
    () => rows.filter((row) => row.suggestedCategory !== null).length,
    [rows],
  );
  const unreviewedCount = useMemo(
    () =>
      rows.filter((row) => row.reviewed !== true && row.skipped !== true)
        .length,
    [rows],
  );
  const skippedCount = useMemo(
    () => rows.filter((row) => row.skipped === true).length,
    [rows],
  );
  const categoriesByType = useMemo<Record<'expense' | 'income', Category[]>>(
    () => ({
      expense: expenseCategoriesQuery.data ?? [],
      income: incomeCategoriesQuery.data ?? [],
    }),
    [expenseCategoriesQuery.data, incomeCategoriesQuery.data],
  );

  useEffect(() => {
    if (!hasHydratedDraft.current) {
      hasHydratedDraft.current = true;
      return;
    }

    if (sourceFileName === null || rows.length === 0) {
      return;
    }

    const updatedAt = saveImportReviewDraft({
      exportCsvMode,
      exportCsvPeriod,
      rows,
      sourceFileName,
    });

    if (updatedAt !== null) {
      setDraftUpdatedAt(updatedAt);
    }
  }, [
    exportCsvMode,
    exportCsvPeriod,
    hasHydratedDraft,
    rows,
    saveImportReviewDraft,
    setDraftUpdatedAt,
    sourceFileName,
  ]);

  function previewSelectedFile(selectedFile: File) {
    if (!isSupportedImportFile(selectedFile)) {
      previewMutation.mutate(selectedFile);
      return;
    }

    if (!confirmDraftReplacement(sourceFileName, rows)) {
      return;
    }

    setPendingUploadFileName(selectedFile.name);
    previewMutation.mutate(selectedFile, {
      onSuccess: (preview) => {
        const reviewRows = preview.rows.map(toImportReviewRow);

        setSourceFileName(selectedFile.name);
        setRows(reviewRows);
        setTextPreview(preview.textPreview);
        setExportCsvMode('all');
        setExportCsvPeriod(allExportCsvPeriod);
        setDraftUpdatedAt(null);

        if (reviewRows.length === 0) {
          clearImportReviewDraft();
        }
      },
      onSettled: () => {
        setPendingUploadFileName(null);
      },
    });
  }

  function handleClearDraft() {
    clearImportReviewDraft();
    setSourceFileName(null);
    setPendingUploadFileName(null);
    setRows([]);
    setTextPreview('');
    setExportCsvMode('all');
    setExportCsvPeriod(allExportCsvPeriod);
    setDraftUpdatedAt(null);
    previewMutation.reset();
  }

  const fileDrop = useImportFileDrop({
    onFileSelected: previewSelectedFile,
  });

  return {
    applyToMatchingRows,
    categoriesByType,
    displayedFileName,
    draftUpdatedAt,
    errorMessage,
    exportCsvMode,
    exportCsvPeriod,
    exportMonthOptions,
    exportableRowCount,
    fileDrop,
    handleClearDraft,
    handleDownloadCsv,
    hasReviewDraft,
    isUploading,
    markReviewedRow,
    matchingRowCounts,
    resetReviewRows,
    rows,
    setApplyToMatchingRows,
    setExportCsvMode,
    setExportCsvPeriod,
    skippedCount,
    sourceFileName,
    suggestionCount,
    textPreview,
    toggleSkippedRow,
    unreviewedCount,
    updateReviewRows,
  };
}

function confirmDraftReplacement(
  sourceFileName: string | null,
  rows: ImportReviewRow[],
): boolean {
  if (rows.length === 0 || typeof window === 'undefined') {
    return true;
  }

  const draftName = sourceFileName ?? 'the current import';

  return window.confirm(
    `Replace the saved review draft for ${draftName}? The existing local draft will stay available if the new preview fails.`,
  );
}
