import type { Category } from '../../../../hooks/useCategories';
import { cn } from '../../../../lib/utils';
import { formatTransactionAmount } from '../../../../utils';
import type {
  ApplyMatchingRowsScope,
  ImportPreviewRow,
  ImportReviewRow,
} from '../../types';
import {
  formatCategorySuggestion,
  getConfidenceBadgeClassName,
  hasImportReviewChanges,
} from '../../utils/reviewRows';
import { EditableSuggestionInput } from './EditableSuggestionInput';
import { RowActions } from './RowActions';

export function PreviewRow({
  applyMatchingRowsScope,
  categories,
  index,
  matchingCounts,
  row,
  onChange,
  onMarkReviewed,
  onReset,
  onToggleSkipped,
}: {
  applyMatchingRowsScope: ApplyMatchingRowsScope;
  categories: Category[];
  index: number;
  matchingCounts: { filtered: number; total: number };
  row: ImportReviewRow;
  onChange: (index: number, changes: Partial<ImportPreviewRow>) => void;
  onMarkReviewed: (index: number) => void;
  onReset: (index: number) => void;
  onToggleSkipped: (index: number) => void;
}) {
  const isSkipped = row.skipped === true;
  const categoryInputId = `import-category-${index}`;
  const subcategoryInputId = `import-subcategory-${index}`;
  const hasCategory =
    row.suggestedCategory !== null && row.suggestedCategory.trim().length > 0;
  const selectedCategory = categories.find(
    (category) => category.name === row.suggestedCategory,
  );
  const subcategories = selectedCategory?.subcategories ?? [];
  const categoryOptions = categories.map((category) => category.name);
  const subcategoryOptions = subcategories.map(
    (subcategory) => subcategory.name,
  );
  const hasReviewChanges = hasImportReviewChanges(row);
  const canReset = row.reviewed === true || hasReviewChanges;
  const matchingBadge = getMatchingBadge(
    applyMatchingRowsScope,
    matchingCounts,
  );

  function updateCategory(categoryName: string) {
    onChange(index, {
      suggestedCategory: categoryName.trim().length === 0 ? null : categoryName,
      suggestedSubcategory: null,
    });
  }

  return (
    <div
      className={cn(
        'grid min-w-[1160px] grid-cols-[6.5rem_minmax(16rem,1fr)_7.5rem_minmax(14rem,0.9fr)_minmax(20rem,1.45fr)_6.75rem] items-center gap-4 border-l-2 border-transparent px-5 py-4 text-sm transition-colors hover:bg-canvas/35',
        row.reviewed === true &&
          !isSkipped &&
          'border-l-accent-green/70 bg-accent-green/[0.03] hover:bg-accent-green/[0.06]',
        isSkipped &&
          'border-l-accent-rose/60 bg-panel-raised/35 opacity-60 hover:bg-panel-raised/55',
      )}
    >
      <span className='font-medium leading-8 text-muted-strong'>{row.date}</span>
      <span className='grid min-w-0 gap-1.5'>
        <span className='flex min-w-0 items-center gap-2'>
          <span className='line-clamp-1 text-xs font-semibold uppercase tracking-[0.1em] text-muted'>
            {row.concept ?? 'No concept'}
          </span>
          {matchingBadge !== null ? (
            <span className='inline-flex h-5 shrink-0 items-center rounded-full bg-accent-lavender/10 px-2 text-[11px] font-bold text-accent-lavender'>
              {matchingBadge}
            </span>
          ) : null}
        </span>
        <label className='min-w-0'>
          <span className='sr-only'>Description</span>
          <input
            className='h-8 w-full rounded-md border border-line bg-panel-raised px-3 text-sm font-medium text-ink outline-none transition focus:border-accent-lavender focus:ring-2 focus:ring-accent-lavender/25 disabled:cursor-not-allowed disabled:opacity-70'
            disabled={isSkipped}
            value={row.description}
            onChange={(event) =>
              onChange(index, { description: event.target.value })
            }
          />
        </label>
        {row.description !== row.originalDescription ? (
          <span className='line-clamp-1 text-xs font-medium text-muted'>
            Original: {row.originalDescription}
          </span>
        ) : null}
      </span>
      <span
        className={cn(
          'justify-self-end text-right font-semibold leading-8 tabular-nums',
          row.type === 'income' ? 'text-accent-green' : 'text-accent-rose',
        )}
      >
        {formatTransactionAmount(row)}
      </span>
      <span className='grid min-w-0 gap-1.5'>
        <EditableSuggestionInput
          id={categoryInputId}
          label='Category'
          options={categoryOptions}
          value={row.suggestedCategory ?? ''}
          placeholder='None'
          disabled={isSkipped}
          className={cn(
            'font-semibold',
            row.suggestedCategory ? 'text-accent-green' : 'text-muted',
          )}
          onValueChange={updateCategory}
        />
        <EditableSuggestionInput
          id={subcategoryInputId}
          label='Subcategory'
          options={subcategoryOptions}
          value={row.suggestedSubcategory ?? ''}
          placeholder='None'
          disabled={isSkipped || !hasCategory}
          className='font-medium text-muted-strong disabled:opacity-50'
          onValueChange={(value) =>
            onChange(index, {
              suggestedSubcategory:
                value.trim().length === 0 ? null : value,
            })
          }
        />
        {row.reviewed === true &&
        (row.suggestedCategory !== row.originalSuggestedCategory ||
          row.suggestedSubcategory !== row.originalSuggestedSubcategory) ? (
          <span className='line-clamp-1 text-xs font-medium leading-5 text-muted'>
            Original:{' '}
            {formatCategorySuggestion(
              row.originalSuggestedCategory,
              row.originalSuggestedSubcategory,
            )}
          </span>
        ) : null}
      </span>
      <span className='grid min-w-0 gap-1.5 text-muted'>
        <span className='flex min-w-0 items-center gap-2'>
          <span
            className={cn(
              'inline-flex h-5 shrink-0 items-center rounded-full px-2 text-[11px] font-bold',
              getConfidenceBadgeClassName(row.confidence),
            )}
          >
            {row.confidence}%
          </span>
          <span className='line-clamp-1 text-xs font-semibold text-muted-strong'>
            {row.matchReason}
          </span>
        </span>
        {row.matchedDescription ? (
          <span className='line-clamp-2 text-xs leading-5 text-muted'>
            {row.matchedDescription}
          </span>
        ) : null}
      </span>
      <RowActions
        canReset={canReset}
        index={index}
        isReviewed={row.reviewed === true}
        isSkipped={isSkipped}
        onMarkReviewed={onMarkReviewed}
        onReset={onReset}
        onToggleSkipped={onToggleSkipped}
      />
    </div>
  );
}

function getMatchingBadge(
  scope: ApplyMatchingRowsScope,
  counts: { filtered: number; total: number },
): string | null {
  if (counts.total <= 1) {
    return null;
  }

  if (scope === 'none') {
    return `${counts.total} matches`;
  }

  if (scope === 'all') {
    return `${counts.total} linked (all)`;
  }

  return counts.filtered > 1
    ? `${counts.filtered} visible linked`
    : `${counts.total} matches`;
}
