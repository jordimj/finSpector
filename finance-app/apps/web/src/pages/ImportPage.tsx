import { useMutation } from '@tanstack/react-query';
import {
  Ban,
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  RotateCcw,
  Trash2,
  UploadCloud,
} from 'lucide-react';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react';
import { useCategories, type Category } from '../hooks/useCategories';
import { apiBaseUrl } from '../lib/api';
import { cn } from '../lib/utils';
import { formatTransactionAmount } from '../utils';

type ImportPreviewRow = {
  date: string;
  description: string;
  concept?: string;
  amount: string;
  type: 'expense' | 'income';
  rawText: string;
  suggestedDescription: string | null;
  suggestedCategory: string | null;
  suggestedSubcategory: string | null;
  confidence: number;
  matchedDescription: string | null;
  matchedAmount: string | null;
  matchedDate: string | null;
  matchReason: string;
  reviewed?: boolean;
  skipped?: boolean;
};

type ImportReviewRow = ImportPreviewRow & {
  originalDescription: string;
  originalSuggestedCategory: string | null;
  originalSuggestedSubcategory: string | null;
  originalReviewKey: string;
};

type ImportPreviewResponse = {
  extractedTextLength: number;
  rowCount: number;
  rows: ImportPreviewRow[];
  textPreview: string;
};

type ExportCsvRow = {
  date: string;
  category: string | null;
  subcategory: string | null;
  description: string;
  amount: string;
  type: ImportPreviewRow['type'];
  bankConcept: string;
};

type ExportCsvMode = 'all' | ImportPreviewRow['type'];

type ExportCsvPeriod =
  | {
      type: 'all';
    }
  | {
      type: 'month';
      month: string;
    };

type ExportMonthOption = {
  label: string;
  month: string;
};

type ImportReviewDraft = {
  version: typeof importReviewDraftVersion;
  sourceFileName: string;
  rows: ImportReviewRow[];
  exportCsvMode: ExportCsvMode;
  exportCsvPeriod: ExportCsvPeriod;
  updatedAt: string;
};

const importReviewDraftVersion = 1;
const importReviewDraftStorageKey = 'finance.importAssistant.reviewDraft.v1';
const allExportCsvPeriod: ExportCsvPeriod = { type: 'all' };
const exportMonthPattern = /^\d{4}-\d{2}$/;

const csvHeaders: Array<keyof ExportCsvRow> = [
  'date',
  'category',
  'subcategory',
  'description',
  'amount',
  'type',
  'bankConcept',
];

const exportCsvModeOptions: Array<{
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

export function ImportPage() {
  const [initialDraft] = useState<ImportReviewDraft | null>(
    loadImportReviewDraft,
  );
  const [sourceFileName, setSourceFileName] = useState<string | null>(
    initialDraft?.sourceFileName ?? null,
  );
  const [pendingUploadFileName, setPendingUploadFileName] = useState<
    string | null
  >(null);
  const [rows, setRows] = useState<ImportReviewRow[]>(
    initialDraft?.rows ?? [],
  );
  const [textPreview, setTextPreview] = useState('');
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [applyToMatchingRows, setApplyToMatchingRows] = useState(true);
  const [exportCsvMode, setExportCsvMode] = useState<ExportCsvMode>(
    initialDraft?.exportCsvMode ?? 'all',
  );
  const [exportCsvPeriod, setExportCsvPeriod] = useState<ExportCsvPeriod>(
    initialDraft?.exportCsvPeriod ?? allExportCsvPeriod,
  );
  const [draftUpdatedAt, setDraftUpdatedAt] = useState<string | null>(
    initialDraft?.updatedAt ?? null,
  );
  const hasHydratedDraft = useRef(false);
  const previewMutation = useMutation({
    mutationFn: fetchImportPreview,
  });
  const categoriesQuery = useCategories();
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
  const matchingRowCounts = useMemo(() => {
    const counts = new Map<string, number>();

    for (const row of rows) {
      const key = row.originalReviewKey;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    return rows.map((row) => counts.get(row.originalReviewKey) ?? 1);
  }, [rows]);

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
  }, [exportCsvMode, exportCsvPeriod, rows, sourceFileName]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] ?? null;

    if (selectedFile === null) {
      return;
    }

    previewSelectedFile(selectedFile);
    event.target.value = '';
  }

  function handleDragOver(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
    setIsDraggingFile(true);
  }

  function handleDragLeave(event: DragEvent<HTMLLabelElement>) {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) {
      return;
    }

    setIsDraggingFile(false);
  }

  function handleDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    setIsDraggingFile(false);

    const selectedFile = event.dataTransfer.files[0] ?? null;

    if (selectedFile === null) {
      return;
    }

    previewSelectedFile(selectedFile);
  }

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

  return (
    <section className='mx-auto flex h-full min-h-0 max-h-screen max-w-[1600px] flex-col gap-3'>
      <div className='flex shrink-0 flex-col gap-3 lg:flex-row lg:items-end lg:justify-between'>
        <div>
          <h1 className='text-2xl font-semibold tracking-normal text-ink md:text-3xl'>
            Import assistant
          </h1>
          <p className='mt-1 max-w-3xl text-sm font-medium leading-5 text-muted-strong'>
            Upload a statement, review suggested categories, and export a CSV.
          </p>
        </div>

        {rows.length > 0 && (
          <div className='flex shrink-0 flex-col gap-2 sm:flex-row sm:items-end'>
            <select
              className='h-10 rounded-md border border-line bg-panel px-3 text-sm font-semibold text-muted-strong outline-none transition focus:border-accent-lavender focus:ring-2 focus:ring-accent-lavender/25'
              value={exportCsvMode}
              onChange={(event) =>
                setExportCsvMode(event.target.value as ExportCsvMode)
              }
            >
              {exportCsvModeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select
              className='h-10 rounded-md border border-line bg-panel px-3 text-sm font-semibold text-muted-strong outline-none transition focus:border-accent-lavender focus:ring-2 focus:ring-accent-lavender/25'
              value={exportCsvPeriodToSelectValue(exportCsvPeriod)}
              onChange={(event) =>
                setExportCsvPeriod(
                  exportCsvPeriodFromSelectValue(event.target.value),
                )
              }
            >
              <option value='all'>All dates</option>
              {exportMonthOptions.map((option) => (
                <option key={option.month} value={`month:${option.month}`}>
                  {option.label}
                </option>
              ))}
            </select>

            <button
              type='button'
              className='inline-flex h-10 items-center justify-center gap-2 rounded-md border border-line bg-panel-raised px-4 text-sm font-semibold text-muted-strong transition hover:text-ink disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-lavender'
              disabled={exportableRowCount === 0}
              onClick={handleDownloadCsv}
              title={
                exportableRowCount === 0
                  ? 'No rows match this CSV export selection'
                  : undefined
              }
            >
              <Download className='size-4' aria-hidden='true' />
              Download CSV ({exportableRowCount})
            </button>
          </div>
        )}
      </div>

      <div className='shrink-0 rounded-lg border border-line bg-panel p-3 shadow-shell'>
        <div className='grid gap-3 xl:grid-cols-[minmax(20rem,1fr)_minmax(26rem,1.25fr)_minmax(18rem,0.9fr)] xl:items-stretch'>
          <label
            className={cn(
              'flex min-h-24 cursor-pointer items-center gap-3 rounded-md border border-dashed border-line bg-panel-raised/55 px-3 py-3 transition hover:border-accent-lavender',
              isDraggingFile && 'border-accent-lavender bg-accent-lavender/10',
            )}
            onDragEnter={() => setIsDraggingFile(true)}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
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
              onChange={handleFileChange}
              type='file'
            />
          </label>

          <div className='rounded-md border border-line bg-canvas/40 p-3'>
            <p className='text-sm font-semibold text-ink'>Review summary</p>
            <dl className='mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-4 xl:grid-cols-4'>
              <div>
                <dt className='text-xs font-bold uppercase tracking-[0.14em] text-muted'>
                  Rows
                </dt>
                <dd className='mt-1 text-base font-semibold text-ink'>
                  {rows.length}
                </dd>
              </div>
              <div>
                <dt className='text-xs font-bold uppercase tracking-[0.14em] text-muted'>
                  Suggested
                </dt>
                <dd className='mt-1 text-base font-semibold text-ink'>
                  {suggestionCount}
                </dd>
              </div>
              <div>
                <dt className='text-xs font-bold uppercase tracking-[0.14em] text-muted'>
                  Unreviewed
                </dt>
                <dd className='mt-1 text-base font-semibold text-ink'>
                  {unreviewedCount}
                </dd>
              </div>
              <div>
                <dt className='text-xs font-bold uppercase tracking-[0.14em] text-muted'>
                  Skipped
                </dt>
                <dd className='mt-1 text-base font-semibold text-ink'>
                  {skippedCount}
                </dd>
              </div>
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

        {hasReviewDraft && (
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
        )}

        {errorMessage && (
          <div className='mt-4 rounded-md border border-accent-rose/30 bg-accent-rose/10 px-3 py-3 text-sm font-medium leading-6 text-accent-rose'>
            {errorMessage}
          </div>
        )}
      </div>

      <div className='flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-line bg-panel shadow-shell'>
        <div className='grid grid-cols-[7rem_minmax(10rem,0.8fr)_minmax(16rem,1.4fr)_8rem_minmax(15rem,1fr)_7rem_minmax(14rem,1fr)_6rem] gap-4 border-b border-line px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-muted'>
          <span>Date</span>
          <span>Concept</span>
          <span>Description</span>
          <span>Amount</span>
          <span>Category</span>
          <span>Status</span>
          <span>Evidence</span>
          <span className='sr-only'>Actions</span>
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
                  categories={categoriesQuery.data ?? []}
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
    </section>
  );
}

function EmptyPreviewState({ textPreview }: { textPreview: string }) {
  if (textPreview.length > 0) {
    return (
      <div className='flex min-h-0 flex-col px-6 py-6'>
        <div className='mb-4 rounded-md border border-accent-amber/30 bg-accent-amber/10 px-4 py-3'>
          <p className='text-sm font-semibold text-accent-amber'>
            Text was extracted, but no transaction rows matched yet.
          </p>
          <p className='mt-2 text-sm leading-6 text-muted-strong'>
            The parser now handles split date, description, and amount lines. If
            this still shows no rows, the text order below will tell us which
            bank-specific pattern to support next.
          </p>
        </div>

        <div className='min-h-0 flex-1 overflow-auto rounded-md border border-line bg-canvas/55'>
          <div className='border-b border-line px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-muted'>
            Extracted text preview
          </div>
          <pre className='whitespace-pre-wrap px-4 py-4 text-xs leading-5 text-muted-strong'>
            {textPreview}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className='flex min-h-80 flex-col items-center justify-center px-6 text-center'>
      <FileText className='mb-4 size-10 text-muted' aria-hidden='true' />
      <p className='text-sm font-semibold text-ink'>No preview rows yet</p>
      <p className='mt-2 max-w-md text-sm leading-6 text-muted'>
        Choose a PDF or spreadsheet to see extracted transactions and
        conservative category suggestions from historical data.
      </p>
    </div>
  );
}

function PreviewRow({
  applyToMatchingRows,
  categories,
  index,
  matchingCount,
  row,
  onChange,
  onMarkReviewed,
  onReset,
  onToggleSkipped,
}: {
  applyToMatchingRows: boolean;
  categories: Category[];
  index: number;
  matchingCount: number;
  row: ImportReviewRow;
  onChange: (index: number, changes: Partial<ImportPreviewRow>) => void;
  onMarkReviewed: (index: number) => void;
  onReset: (index: number) => void;
  onToggleSkipped: (index: number) => void;
}) {
  const isSkipped = row.skipped === true;
  const selectedCategory = categories.find(
    (category) => category.name === row.suggestedCategory,
  );
  const subcategories = selectedCategory?.subcategories ?? [];

  function updateCategory(categoryName: string) {
    onChange(index, {
      suggestedCategory: categoryName === '' ? null : categoryName,
      suggestedSubcategory: null,
    });
  }

  return (
    <div
      className={cn(
        'grid min-w-[1340px] grid-cols-[7rem_minmax(10rem,0.8fr)_minmax(16rem,1.4fr)_8rem_minmax(15rem,1fr)_7rem_minmax(14rem,1fr)_6rem] gap-4 px-5 py-4 text-sm transition',
        isSkipped && 'bg-panel-raised/35 opacity-55',
      )}
    >
      <span className='font-medium text-muted-strong'>{row.date}</span>
      <span className='min-w-0 text-muted-strong'>
        <span className='line-clamp-2'>{row.concept ?? '-'}</span>
        {matchingCount > 1 ? (
          <span className='mt-1 block text-xs font-semibold text-accent-lavender'>
            {applyToMatchingRows
              ? `Updates ${matchingCount} matching rows`
              : `${matchingCount} matching rows`}
          </span>
        ) : null}
      </span>
      <label className='min-w-0'>
        <span className='sr-only'>Description</span>
        <textarea
          className='min-h-16 w-full resize-y rounded-md border border-line bg-panel-raised px-3 py-2 text-sm font-medium leading-5 text-ink outline-none transition focus:border-accent-lavender focus:ring-2 focus:ring-accent-lavender/25 disabled:cursor-not-allowed disabled:opacity-70'
          disabled={isSkipped}
          value={row.description}
          onChange={(event) =>
            onChange(index, { description: event.target.value })
          }
        />
        {row.description !== row.originalDescription ? (
          <span className='mt-1 block line-clamp-2 text-xs font-medium text-muted'>
            Original: {row.originalDescription}
          </span>
        ) : null}
      </label>
      <span
        className={cn(
          'font-semibold tabular-nums',
          row.type === 'income' ? 'text-accent-green' : 'text-accent-rose',
        )}
      >
        {formatTransactionAmount(row)}
      </span>
      <span className='grid min-w-0 gap-2'>
        <label>
          <span className='sr-only'>Category</span>
          <select
            className={cn(
              'h-9 w-full rounded-md border border-line bg-panel-raised px-3 text-sm font-semibold outline-none transition focus:border-accent-lavender focus:ring-2 focus:ring-accent-lavender/25 disabled:cursor-not-allowed disabled:opacity-70',
              row.suggestedCategory ? 'text-accent-green' : 'text-muted',
            )}
            disabled={isSkipped}
            value={row.suggestedCategory ?? ''}
            onChange={(event) => updateCategory(event.target.value)}
          >
            <option value=''>None</option>
            {categories.map((category) => (
              <option key={category.id} value={category.name}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className='sr-only'>Subcategory</span>
          <select
            className='h-9 w-full rounded-md border border-line bg-panel-raised px-3 text-sm font-medium text-muted-strong outline-none transition focus:border-accent-lavender focus:ring-2 focus:ring-accent-lavender/25 disabled:cursor-not-allowed disabled:opacity-50'
            disabled={isSkipped || row.suggestedCategory === null}
            value={row.suggestedSubcategory ?? ''}
            onChange={(event) =>
              onChange(index, {
                suggestedSubcategory:
                  event.target.value === '' ? null : event.target.value,
              })
            }
          >
            <option value=''>None</option>
            {subcategories.map((subcategory) => (
              <option key={subcategory.id} value={subcategory.name}>
                {subcategory.name}
              </option>
            ))}
          </select>
        </label>
        {row.reviewed === true &&
        (row.suggestedCategory !== row.originalSuggestedCategory ||
          row.suggestedSubcategory !== row.originalSuggestedSubcategory) ? (
          <span className='text-xs font-medium leading-5 text-muted'>
            Original:{' '}
            {formatCategorySuggestion(
              row.originalSuggestedCategory,
              row.originalSuggestedSubcategory,
            )}
          </span>
        ) : null}
      </span>
      <span>
        {isSkipped ? (
          <span className='inline-flex h-7 w-fit items-center gap-1.5 rounded-full bg-panel-raised px-2.5 text-xs font-bold text-muted'>
            <Ban className='size-4' aria-hidden='true' />
            Skipped
          </span>
        ) : row.reviewed === true ? (
          <span className='grid gap-2'>
            <span className='inline-flex h-7 w-fit items-center gap-1.5 rounded-full bg-accent-green/15 px-2.5 text-xs font-bold text-accent-green'>
              <CheckCircle2 className='size-4' aria-hidden='true' />
              Reviewed
            </span>
            <button
              className='inline-flex h-8 w-fit items-center gap-1.5 rounded-md border border-line bg-panel-raised px-2.5 text-xs font-semibold text-muted-strong transition hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-lavender'
              onClick={() => onReset(index)}
              type='button'
            >
              <RotateCcw className='size-3.5' aria-hidden='true' />
              Reset
            </button>
          </span>
        ) : (
          <span
            className={cn(
              'inline-flex h-6 items-center rounded-full px-2 text-xs font-bold',
              row.confidence >= 70 && 'bg-accent-green/15 text-accent-green',
              row.confidence >= 55 &&
                row.confidence < 70 &&
                'bg-accent-amber/15 text-accent-amber',
              row.confidence < 55 && 'bg-panel-raised text-muted',
            )}
          >
            {row.confidence}%
          </span>
        )}
      </span>
      <span className='min-w-0 text-muted'>
        <span className='line-clamp-2'>
          {row.matchedDescription
            ? `${row.matchReason} - ${row.matchedDescription}`
            : row.matchReason}
        </span>
      </span>
      <span className='flex justify-end gap-2'>
        <button
          className={cn(
            'inline-flex size-9 items-center justify-center rounded-md border border-line bg-panel-raised text-muted-strong transition hover:text-ink disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-lavender',
            row.reviewed === true &&
              'border-accent-green/30 bg-accent-green/15 text-accent-green hover:text-accent-green',
          )}
          disabled={isSkipped}
          onClick={() => onMarkReviewed(index)}
          title={
            isSkipped
              ? 'Skipped rows are excluded from CSV'
              : row.reviewed === true
                ? 'Row reviewed'
                : 'Mark row as reviewed'
          }
          type='button'
          aria-label={
            row.reviewed === true ? 'Row reviewed' : 'Mark row as reviewed'
          }
        >
          <CheckCircle2 className='size-4' aria-hidden='true' />
        </button>
        <button
          className={cn(
            'inline-flex size-9 items-center justify-center rounded-md border border-line bg-panel-raised text-muted-strong transition hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-lavender',
            isSkipped &&
              'border-accent-rose/30 bg-accent-rose/10 text-accent-rose hover:text-accent-rose',
          )}
          onClick={() => onToggleSkipped(index)}
          title={isSkipped ? 'Include this row in CSV' : 'Skip this row in CSV'}
          type='button'
          aria-label={
            isSkipped ? 'Include this row in CSV' : 'Skip this row in CSV'
          }
        >
          <Ban className='size-4' aria-hidden='true' />
        </button>
      </span>
    </div>
  );
}

function toImportReviewRow(row: ImportPreviewRow): ImportReviewRow {
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

function loadImportReviewDraft(): ImportReviewDraft | null {
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

function saveImportReviewDraft({
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

function clearImportReviewDraft() {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.removeItem(importReviewDraftStorageKey);
  } catch {
    // localStorage can be unavailable in private or restricted browser modes.
  }
}

function normalizeImportReviewDraft(value: unknown): ImportReviewDraft | null {
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

async function fetchImportPreview(file: File): Promise<ImportPreviewResponse> {
  if (!isSupportedImportFile(file)) {
    throw new Error('Choose a PDF or Excel file first.');
  }

  const response = await fetch(`${apiBaseUrl}${previewPathForFile(file)}`, {
    body: file,
    headers: {
      Accept: 'application/json',
      'Content-Type': contentTypeForFile(file),
    },
    method: 'POST',
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;

    throw new Error(
      errorBody?.message ?? `Preview failed with ${response.status}`,
    );
  }

  return response.json() as Promise<ImportPreviewResponse>;
}

function resetImportReviewRow(row: ImportReviewRow): ImportReviewRow {
  return {
    ...row,
    description: row.suggestedDescription ?? row.originalDescription,
    suggestedCategory: row.originalSuggestedCategory,
    suggestedSubcategory: row.originalSuggestedSubcategory,
    reviewed: undefined,
  };
}

function formatCategorySuggestion(
  category: string | null,
  subcategory: string | null,
): string {
  if (category === null) {
    return 'None';
  }

  return subcategory === null ? category : `${category} / ${subcategory}`;
}

function buildExportMonthOptions(rows: ImportReviewRow[]): ExportMonthOption[] {
  const countsByMonth = new Map<string, number>();

  for (const row of rows) {
    const month = getReviewRowMonth(row);

    if (month === null) {
      continue;
    }

    countsByMonth.set(month, (countsByMonth.get(month) ?? 0) + 1);
  }

  return Array.from(countsByMonth.entries())
    .sort(([firstMonth], [secondMonth]) => firstMonth.localeCompare(secondMonth))
    .map(([month, rowCount]) => ({
      label: `${formatExportMonth(month)} (${rowCount} ${
        rowCount === 1 ? 'row' : 'rows'
      })`,
      month,
    }));
}

function exportCsvPeriodToSelectValue(period: ExportCsvPeriod): string {
  return period.type === 'all' ? 'all' : `month:${period.month}`;
}

function exportCsvPeriodFromSelectValue(value: string): ExportCsvPeriod {
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

function matchesExportPeriod(
  row: ImportReviewRow,
  period: ExportCsvPeriod,
): boolean {
  if (period.type === 'all') {
    return true;
  }

  return getReviewRowMonth(row) === period.month;
}

function getReviewRowMonth(row: ImportReviewRow): string | null {
  const trimmedDate = row.date.trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmedDate)) {
    return null;
  }

  return trimmedDate.slice(0, 7);
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

function toReviewCsv(
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

function isExportedReviewRow(
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

function buildReviewRowKey(row: ImportPreviewRow): string {
  return `${normalizeReviewText(row.concept ?? '')}::${normalizeReviewText(
    row.description,
  )}`;
}

function normalizeReviewText(value: string): string {
  return value.replace(/\s+/g, ' ').trim().toLocaleLowerCase();
}

function buildDownloadName(
  fileName: string | null | undefined,
  exportMode: ExportCsvMode,
  exportPeriod: ExportCsvPeriod,
): string {
  const baseName =
    fileName?.replace(/\.(pdf|xls|xlsx|xlsm)$/i, '') || 'import-preview';
  const modeSuffix = exportMode === 'all' ? 'review' : `${exportMode}-review`;
  const suffix =
    exportPeriod.type === 'all'
      ? modeSuffix
      : `${exportPeriod.month}-${modeSuffix}`;

  return `${baseName}-${suffix}.csv`;
}

function previewPathForFile(file: File): string {
  return isSpreadsheetFile(file)
    ? '/api/imports/spreadsheet-preview'
    : '/api/imports/pdf-preview';
}

function contentTypeForFile(file: File): string {
  if (!isSpreadsheetFile(file)) {
    return 'application/pdf';
  }

  return file.name.toLowerCase().endsWith('.xlsx') ||
    file.name.toLowerCase().endsWith('.xlsm')
    ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    : 'application/vnd.ms-excel';
}

function isSpreadsheetFile(file: File): boolean {
  return /\.(xls|xlsx|xlsm)$/i.test(file.name);
}

function isSupportedImportFile(file: File): boolean {
  return /\.(pdf|xls|xlsx|xlsm)$/i.test(file.name);
}

function formatDraftSavedAt(value: string): string {
  const savedAt = new Date(value);

  if (!Number.isFinite(savedAt.getTime())) {
    return 'locally';
  }

  return savedAt.toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function isExportCsvMode(value: unknown): value is ExportCsvMode {
  return value === 'all' || value === 'expense' || value === 'income';
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
