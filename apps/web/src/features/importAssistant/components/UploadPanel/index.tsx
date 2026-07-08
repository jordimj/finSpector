import { Loader2, Trash2, UploadCloud } from 'lucide-react';
import type { ChangeEvent, DragEvent } from 'react';
import { cn } from '../../../../lib/utils';
import { useImportAssistantState } from '../../hooks/useImportAssistantState';
import { formatDraftSavedAt } from '../../utils/draftStorage';

export type ImportFileDropHandlers = {
  handleDragLeave: (event: DragEvent<HTMLLabelElement>) => void;
  handleDragOver: (event: DragEvent<HTMLLabelElement>) => void;
  handleDrop: (event: DragEvent<HTMLLabelElement>) => void;
  handleFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  isDraggingFile: boolean;
  setIsDraggingFile: (isDragging: boolean) => void;
};

export function UploadPanel() {
  const {
    applyToMatchingRows,
    displayedFileName,
    draftUpdatedAt,
    errorMessage,
    fileDrop,
    handleClearDraft,
    hasReviewDraft,
    isUploading,
    rows,
    setApplyToMatchingRows,
    skippedCount,
    sourceFileName,
    suggestionCount,
    unreviewedCount,
  } = useImportAssistantState();
  const rowsCount = rows.length;

  return (
    <div className='shrink-0 rounded-lg border border-line bg-panel p-3 shadow-shell'>
      <div className='grid gap-3 xl:grid-cols-[minmax(20rem,1fr)_minmax(26rem,1.25fr)_minmax(18rem,0.9fr)] xl:items-stretch'>
        <label
          className={cn(
            'flex min-h-24 cursor-pointer items-center gap-3 rounded-md border border-dashed border-line bg-panel-raised/55 px-3 py-3 transition hover:border-accent-lavender',
            fileDrop.isDraggingFile &&
              'border-accent-lavender bg-accent-lavender/10',
          )}
          onDragEnter={() => fileDrop.setIsDraggingFile(true)}
          onDragLeave={fileDrop.handleDragLeave}
          onDragOver={fileDrop.handleDragOver}
          onDrop={fileDrop.handleDrop}
          htmlFor='import-assistant-file'
        >
          {isUploading ? (
            <Loader2
              className='size-7 shrink-0 animate-spin text-accent-lavender'
              aria-hidden='true'
            />
          ) : (
            <UploadCloud
              className='size-7 shrink-0 text-accent-lavender'
              aria-hidden='true'
            />
          )}
          <span className='min-w-0'>
            <span className='block truncate text-sm font-semibold text-ink'>
              {displayedFileName ?? 'Choose PDF or Excel file'}
            </span>
            <span className='mt-1 block text-xs font-medium leading-5 text-muted'>
              {isUploading
                ? 'Reading file and matching history.'
                : hasReviewDraft
                  ? 'Review draft restored locally.'
                  : 'Drop a file here or click to browse.'}
            </span>
          </span>
          <input
            accept='application/pdf,.pdf,.xls,.xlsx,.xlsm'
            className='sr-only'
            id='import-assistant-file'
            onChange={fileDrop.handleFileChange}
            type='file'
          />
        </label>

        <div className='rounded-md border border-line bg-canvas/40 p-3'>
          <p className='text-sm font-semibold text-ink'>Review summary</p>
          <dl className='mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4 xl:grid-cols-4'>
            <ReviewMetric label='Rows' value={rowsCount} />
            <ReviewMetric label='Suggested' value={suggestionCount} />
            <ReviewMetric label='Unreviewed' value={unreviewedCount} />
            <ReviewMetric label='Skipped' value={skippedCount} />
          </dl>
        </div>

        <label className='flex items-start gap-3 rounded-md border border-line bg-canvas/40 p-3'>
          <input
            checked={applyToMatchingRows}
            className='mt-1 size-4 accent-accent-lavender'
            onChange={(event) => setApplyToMatchingRows(event.target.checked)}
            type='checkbox'
          />
          <span>
            <span className='block text-sm font-semibold text-ink'>
              Apply edits to matching rows
            </span>
            <span className='mt-1 block text-xs font-medium leading-5 text-muted'>
              Matches use the original concept and description from the file.
            </span>
          </span>
        </label>
      </div>

      {hasReviewDraft ? (
        <div className='mt-3 flex flex-col gap-3 rounded-md border border-line bg-canvas/40 px-3 py-3 sm:flex-row sm:items-center sm:justify-between'>
          <div className='min-w-0'>
            <p className='truncate text-sm font-semibold text-ink'>
              Local draft: {sourceFileName}
            </p>
            <p className='mt-1 text-xs font-medium leading-5 text-muted'>
              {draftUpdatedAt === null
                ? 'Saved locally.'
                : `Saved ${formatDraftSavedAt(draftUpdatedAt)}.`}
            </p>
          </div>
          <button
            className='inline-flex h-9 w-fit items-center justify-center gap-2 rounded-md border border-line bg-panel-raised px-3 text-xs font-semibold text-muted-strong transition hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-lavender'
            onClick={handleClearDraft}
            type='button'
          >
            <Trash2 className='size-4' aria-hidden='true' />
            Clear draft
          </button>
        </div>
      ) : null}

      {errorMessage ? (
        <div className='mt-4 rounded-md border border-accent-rose/30 bg-accent-rose/10 px-3 py-3 text-sm font-medium leading-6 text-accent-rose'>
          {errorMessage}
        </div>
      ) : null}
    </div>
  );
}

function ReviewMetric({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className='text-xs font-bold uppercase tracking-[0.14em] text-muted'>
        {label}
      </dt>
      <dd className='mt-1 text-base font-semibold text-ink'>{value}</dd>
    </div>
  );
}
