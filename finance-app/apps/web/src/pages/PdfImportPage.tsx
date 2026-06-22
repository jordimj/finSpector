import {
  CheckCircle2,
  Download,
  FileText,
  Loader2,
  RotateCcw,
  UploadCloud,
} from 'lucide-react';
import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { useCategories, type Category } from '../hooks/useCategories';
import { apiBaseUrl } from '../lib/api';
import { cn } from '../lib/utils';

type PdfPreviewRow = {
  date: string;
  description: string;
  concept?: string;
  amount: string;
  type: 'expense' | 'income';
  rawText: string;
  suggestedCategory: string | null;
  suggestedSubcategory: string | null;
  confidence: number;
  matchedDescription: string | null;
  matchedAmount: string | null;
  matchedDate: string | null;
  matchReason: string;
  reviewed?: boolean;
};

type ReviewPreviewRow = PdfPreviewRow & {
  originalDescription: string;
  originalSuggestedCategory: string | null;
  originalSuggestedSubcategory: string | null;
  originalReviewKey: string;
};

type PdfPreviewResponse = {
  extractedTextLength: number;
  rowCount: number;
  rows: PdfPreviewRow[];
  textPreview: string;
};

const csvHeaders: Array<keyof PdfPreviewRow> = [
  'date',
  'description',
  'amount',
  'type',
  'suggestedCategory',
  'suggestedSubcategory',
  'confidence',
  'matchedDescription',
  'matchedAmount',
  'matchedDate',
  'matchReason',
];

export function PdfImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ReviewPreviewRow[]>([]);
  const [textPreview, setTextPreview] = useState('');
  const [extractedTextLength, setExtractedTextLength] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [applyToMatchingRows, setApplyToMatchingRows] = useState(true);
  const categoriesQuery = useCategories();
  const suggestionCount = useMemo(
    () => rows.filter((row) => row.suggestedCategory !== null).length,
    [rows],
  );
  const matchingRowCounts = useMemo(() => {
    const counts = new Map<string, number>();

    for (const row of rows) {
      const key = row.originalReviewKey;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    return rows.map((row) => counts.get(row.originalReviewKey) ?? 1);
  }, [rows]);

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0] ?? null;

    setFile(selectedFile);
    setRows([]);
    setTextPreview('');
    setExtractedTextLength(0);
    setErrorMessage(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!file) {
      setErrorMessage('Choose a PDF or Excel file first.');
      return;
    }

    setIsUploading(true);
    setErrorMessage(null);

    try {
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

      const preview = (await response.json()) as PdfPreviewResponse;
      setRows(preview.rows.map(toReviewPreviewRow));
      setTextPreview(preview.textPreview);
      setExtractedTextLength(preview.extractedTextLength);
    } catch (error) {
      setRows([]);
      setTextPreview('');
      setExtractedTextLength(0);
      setErrorMessage(error instanceof Error ? error.message : String(error));
    } finally {
      setIsUploading(false);
    }
  }

  function handleDownloadCsv() {
    const csv = toReviewCsv(rows);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = buildDownloadName(file?.name);
    link.click();
    URL.revokeObjectURL(url);
  }

  function updateReviewRows(index: number, changes: Partial<PdfPreviewRow>) {
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

        return shouldReset ? resetReviewPreviewRow(row) : row;
      });
    });
  }

  return (
    <section className='mx-auto flex h-full min-h-0 max-h-screen max-w-[1600px] flex-col'>
      <div className='mb-7 flex shrink-0 flex-col gap-4 lg:flex-row lg:items-end lg:justify-between'>
        <div>
          <span className='inline-flex h-6 items-center rounded-full bg-accent-lavender/15 px-3 text-xs font-bold uppercase tracking-[0.14em] text-accent-lavender'>
            Hidden tool
          </span>
          <h1 className='mt-3 text-3xl font-semibold tracking-normal text-ink md:text-4xl'>
            Import assistant
          </h1>
          <p className='mt-3 max-w-3xl text-sm font-medium leading-6 text-muted-strong'>
            Upload a statement, extract transaction rows, and compare
            them with categorized history before exporting a review CSV.
          </p>
        </div>

        {rows.length > 0 && (
          <button
            type='button'
            className='inline-flex h-10 items-center justify-center gap-2 rounded-md border border-line bg-panel-raised px-4 text-sm font-semibold text-muted-strong transition hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-lavender'
            onClick={handleDownloadCsv}
          >
            <Download className='size-4' aria-hidden='true' />
            Download CSV
          </button>
        )}
      </div>

      <div className='grid min-h-0 flex-1 gap-5 lg:grid-cols-[22rem_minmax(0,1fr)]'>
        <form
          className='flex flex-col gap-4 rounded-lg border border-line bg-panel p-5 shadow-shell'
          onSubmit={handleSubmit}
        >
          <label
            className='flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-line bg-panel-raised/55 px-5 py-8 text-center transition hover:border-accent-lavender'
            htmlFor='pdf-import-file'
          >
            <UploadCloud
              className='mb-4 size-9 text-accent-lavender'
              aria-hidden='true'
            />
            <span className='text-sm font-semibold text-ink'>
              {file ? file.name : 'Choose PDF or Excel file'}
            </span>
            <span className='mt-2 text-xs font-medium leading-5 text-muted'>
              The preview reads the file in memory only. Nothing is imported or
              saved.
            </span>
            <input
              accept='application/pdf,.pdf,.xls,.xlsx,.xlsm'
              className='sr-only'
              id='pdf-import-file'
              onChange={handleFileChange}
              type='file'
            />
          </label>

          <button
            type='submit'
            className='inline-flex h-10 items-center justify-center gap-2 rounded-md bg-accent-green px-4 text-sm font-bold text-canvas transition hover:bg-accent-green/90 disabled:cursor-not-allowed disabled:opacity-60'
            disabled={isUploading || !file}
          >
            {isUploading ? (
              <Loader2 className='size-4 animate-spin' aria-hidden='true' />
            ) : (
              <FileText className='size-4' aria-hidden='true' />
            )}
            Preview suggestions
          </button>

          {errorMessage && (
            <div className='rounded-md border border-accent-rose/30 bg-accent-rose/10 px-3 py-3 text-sm font-medium leading-6 text-accent-rose'>
              {errorMessage}
            </div>
          )}

          <div className='rounded-md border border-line bg-canvas/40 p-4'>
            <p className='text-sm font-semibold text-ink'>Review summary</p>
            <dl className='mt-4 grid grid-cols-2 gap-3 text-sm'>
              <div>
                <dt className='text-xs font-bold uppercase tracking-[0.14em] text-muted'>
                  Rows
                </dt>
                <dd className='mt-1 text-lg font-semibold text-ink'>
                  {rows.length}
                </dd>
              </div>
              <div>
                <dt className='text-xs font-bold uppercase tracking-[0.14em] text-muted'>
                  Suggested
                </dt>
                <dd className='mt-1 text-lg font-semibold text-ink'>
                  {suggestionCount}
                </dd>
              </div>
              <div className='col-span-2'>
                <dt className='text-xs font-bold uppercase tracking-[0.14em] text-muted'>
                  Text chars
                </dt>
                <dd className='mt-1 text-lg font-semibold text-ink'>
                  {extractedTextLength}
                </dd>
              </div>
            </dl>
          </div>

          <label className='flex items-start gap-3 rounded-md border border-line bg-canvas/40 p-4'>
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
        </form>

        <div className='flex min-h-0 flex-col overflow-hidden rounded-lg border border-line bg-panel shadow-shell'>
          <div className='grid grid-cols-[7rem_minmax(10rem,0.8fr)_minmax(16rem,1.4fr)_7rem_6rem_minmax(15rem,1fr)_7rem_minmax(14rem,1fr)] gap-4 border-b border-line px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-muted'>
            <span>Date</span>
            <span>Concept</span>
            <span>Description</span>
            <span>Amount</span>
            <span>Type</span>
            <span>Category</span>
            <span>Status</span>
            <span>Evidence</span>
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
                    onReset={resetReviewRows}
                  />
                ))}
              </div>
            )}
          </div>
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
            The parser now handles split date, description, and amount lines.
            If this still shows no rows, the text order below will tell us which
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
  onReset,
}: {
  applyToMatchingRows: boolean;
  categories: Category[];
  index: number;
  matchingCount: number;
  row: ReviewPreviewRow;
  onChange: (index: number, changes: Partial<PdfPreviewRow>) => void;
  onReset: (index: number) => void;
}) {
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
    <div className='grid min-w-[1320px] grid-cols-[7rem_minmax(10rem,0.8fr)_minmax(16rem,1.4fr)_7rem_6rem_minmax(15rem,1fr)_7rem_minmax(14rem,1fr)] gap-4 px-5 py-4 text-sm'>
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
          className='min-h-16 w-full resize-y rounded-md border border-line bg-panel-raised px-3 py-2 text-sm font-medium leading-5 text-ink outline-none transition focus:border-accent-lavender focus:ring-2 focus:ring-accent-lavender/25'
          value={row.description}
          onChange={(event) =>
            onChange(index, { description: event.target.value })
          }
        />
        {row.reviewed === true &&
        row.description !== row.originalDescription ? (
          <span className='mt-1 block line-clamp-2 text-xs font-medium text-muted'>
            Original: {row.originalDescription}
          </span>
        ) : null}
      </label>
      <span className='font-semibold text-ink'>{row.amount}</span>
      <span
        className={cn(
          'font-semibold',
          row.type === 'income' ? 'text-accent-green' : 'text-accent-rose',
        )}
      >
        {row.type}
      </span>
      <span className='grid min-w-0 gap-2'>
        <label>
          <span className='sr-only'>Category</span>
          <select
            className={cn(
              'h-9 w-full rounded-md border border-line bg-panel-raised px-3 text-sm font-semibold outline-none transition focus:border-accent-lavender focus:ring-2 focus:ring-accent-lavender/25',
              row.suggestedCategory ? 'text-accent-green' : 'text-muted',
            )}
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
            disabled={row.suggestedCategory === null}
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
            Original: {formatCategorySuggestion(
              row.originalSuggestedCategory,
              row.originalSuggestedSubcategory,
            )}
          </span>
        ) : null}
      </span>
      <span>
        {row.reviewed === true ? (
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
              row.confidence >= 70 &&
                'bg-accent-green/15 text-accent-green',
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
    </div>
  );
}

function toReviewPreviewRow(row: PdfPreviewRow): ReviewPreviewRow {
  return {
    ...row,
    originalDescription: row.description,
    originalSuggestedCategory: row.suggestedCategory,
    originalSuggestedSubcategory: row.suggestedSubcategory,
    originalReviewKey: buildReviewRowKey(row),
  };
}

function resetReviewPreviewRow(row: ReviewPreviewRow): ReviewPreviewRow {
  return {
    ...row,
    description: row.originalDescription,
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

function toReviewCsv(rows: PdfPreviewRow[]): string {
  return [
    csvHeaders.join(';'),
    ...rows.map((row) =>
      csvHeaders.map((header) => escapeCsvValue(row[header])).join(';'),
    ),
  ].join('\n');
}

function escapeCsvValue(value: PdfPreviewRow[keyof PdfPreviewRow]): string {
  const text = value === null || value === undefined ? '' : String(value);

  if (!/[;"\n\r]/.test(text)) {
    return text;
  }

  return `"${text.split('"').join('""')}"`;
}

function buildReviewRowKey(row: PdfPreviewRow): string {
  return `${normalizeReviewText(row.concept ?? '')}::${normalizeReviewText(
    row.description,
  )}`;
}

function normalizeReviewText(value: string): string {
  return value.replace(/\s+/g, ' ').trim().toLocaleLowerCase();
}

function buildDownloadName(fileName: string | undefined): string {
  const baseName =
    fileName?.replace(/\.(pdf|xls|xlsx|xlsm)$/i, '') || 'import-preview';

  return `${baseName}-review.csv`;
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
