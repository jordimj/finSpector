import { Loader2 } from 'lucide-react';
import { useImportAssistantState } from '../../hooks/useImportAssistantState';
import { PreviewRow } from '../PreviewRow';
import { EmptyPreviewState } from './EmptyPreviewState';

export function PreviewTable() {
  const {
    applyToMatchingRows,
    categoriesByType,
    isUploading,
    markReviewedRow,
    matchingRowCounts,
    resetReviewRows,
    rows,
    textPreview,
    toggleSkippedRow,
    updateReviewRows,
  } = useImportAssistantState();

  return (
    <div className='flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-line bg-panel shadow-shell'>
      <div className='grid min-w-[1160px] grid-cols-[6.5rem_minmax(16rem,1fr)_7.5rem_minmax(14rem,0.9fr)_minmax(20rem,1.45fr)_6.75rem] gap-4 border-b border-line px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-muted'>
        <span>Date</span>
        <span>Transaction</span>
        <span>Amount</span>
        <span>Category</span>
        <span>Match</span>
        <span>Actions</span>
      </div>

      <div className='min-h-0 flex-1 overflow-auto'>
        {isUploading ? (
          <div className='flex min-h-80 items-center justify-center gap-2 text-sm font-medium text-muted'>
            <Loader2 className='size-4 animate-spin' aria-hidden='true' />
            Reading file and matching history
          </div>
        ) : rows.length === 0 ? (
          <EmptyPreviewState textPreview={textPreview} />
        ) : (
          <div className='divide-y divide-line'>
            {rows.map((row, index) => (
              <PreviewRow
                key={`${row.date}-${row.amount}-${index}`}
                categories={categoriesByType[row.type]}
                applyToMatchingRows={applyToMatchingRows}
                index={index}
                matchingCount={matchingRowCounts[index] ?? 1}
                row={row}
                onChange={updateReviewRows}
                onMarkReviewed={markReviewedRow}
                onReset={resetReviewRows}
                onToggleSkipped={toggleSkippedRow}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
