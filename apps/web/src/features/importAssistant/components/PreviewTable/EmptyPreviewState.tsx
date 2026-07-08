import { FileText } from 'lucide-react';

export function EmptyPreviewState({ textPreview }: { textPreview: string }) {
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
