import { Header } from '../Header';
import { PreviewTable } from '../PreviewTable';
import { UploadPanel } from '../UploadPanel';
import { useImportAssistantState } from '../../hooks/useImportAssistantState';

export function ImportAssistant() {
  const state = useImportAssistantState();

  return (
    <section className='mx-auto flex h-full min-h-0 max-h-screen max-w-[1600px] flex-col gap-3'>
      <Header
        exportCsvMode={state.exportCsvMode}
        exportCsvPeriod={state.exportCsvPeriod}
        exportMonthOptions={state.exportMonthOptions}
        exportableRowCount={state.exportableRowCount}
        hasRows={state.rows.length > 0}
        onDownloadCsv={state.handleDownloadCsv}
        onExportCsvModeChange={state.setExportCsvMode}
        onExportCsvPeriodChange={state.setExportCsvPeriod}
      />

      <UploadPanel
        applyToMatchingRows={state.applyToMatchingRows}
        displayedFileName={state.displayedFileName}
        draftUpdatedAt={state.draftUpdatedAt}
        errorMessage={state.errorMessage}
        fileDrop={state.fileDrop}
        hasReviewDraft={state.hasReviewDraft}
        isUploading={state.isUploading}
        rowsCount={state.rows.length}
        skippedCount={state.skippedCount}
        sourceFileName={state.sourceFileName}
        suggestionCount={state.suggestionCount}
        unreviewedCount={state.unreviewedCount}
        onApplyToMatchingRowsChange={state.setApplyToMatchingRows}
        onClearDraft={state.handleClearDraft}
      />

      <PreviewTable
        applyToMatchingRows={state.applyToMatchingRows}
        categoriesByType={state.categoriesByType}
        isUploading={state.isUploading}
        matchingRowCounts={state.matchingRowCounts}
        rows={state.rows}
        textPreview={state.textPreview}
        onChange={state.updateReviewRows}
        onMarkReviewed={state.markReviewedRow}
        onReset={state.resetReviewRows}
        onToggleSkipped={state.toggleSkippedRow}
      />
    </section>
  );
}
