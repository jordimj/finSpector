import type { TransactionType } from '@finance/shared';
import type { CategorySpend } from '../hooks/useCategorySpend';
import { formatCurrency } from '../utils';
import { CategoryRows } from './CategoryRows';
import { cn } from '../lib/utils';

type CategoriesCardProps = {
  amountLabel?: string;
  categories: CategorySpend[];
  comparisonCategories?: CategorySpend[];
  comparisonLabel?: string;
  emptyDescription?: string;
  isComparisonError?: boolean;
  isComparisonLoading?: boolean;
  isError: boolean;
  isLoading: boolean;
  itemLabel?: string;
  onCategorySelect?: (category: CategorySpend) => void;
  periodLabel: string;
  title?: string;
  total: number;
  totalVerb?: string;
  type?: TransactionType;
};

export function CategoriesCard({
  amountLabel = 'Spend',
  categories,
  comparisonCategories,
  comparisonLabel,
  emptyDescription,
  isComparisonError = false,
  isComparisonLoading = false,
  isError,
  isLoading,
  itemLabel = 'Category',
  onCategorySelect,
  periodLabel,
  title = 'Category breakdown',
  total,
  totalVerb = 'spent',
  type = 'expense',
}: CategoriesCardProps) {
  const showComparison = comparisonLabel !== undefined;

  return (
    <div className='overflow-hidden rounded-lg border border-line bg-panel shadow-shell'>
      <div className='flex flex-col gap-3 border-b border-line px-5 py-5 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h2 className='text-xl font-semibold tracking-normal text-ink'>
            {title}
          </h2>
          <p className='mt-1 text-sm font-medium text-muted'>
            {isLoading
              ? 'Loading totals'
              : `${formatCurrency(total)} ${totalVerb}`}{' '}
            · {periodLabel}
            {showComparison ? <> · vs {comparisonLabel}</> : null}
          </p>
        </div>
      </div>

      <div
        className={cn(
          'hidden gap-4 border-b border-line bg-panel-raised/35 px-5 py-3 text-xs font-bold uppercase tracking-[0.12em] text-muted-strong md:grid',
          showComparison
            ? 'grid-cols-[minmax(0,1.05fr)_minmax(7rem,0.45fr)_minmax(7rem,0.45fr)_minmax(12rem,0.95fr)]'
            : 'grid-cols-[minmax(0,1.15fr)_minmax(7rem,0.55fr)_minmax(12rem,0.95fr)]',
        )}
      >
        <span>{itemLabel}</span>
        <span className='text-right'>{amountLabel}</span>
        {showComparison ? (
          <span className='text-right'>Previous</span>
        ) : null}
        <span>{showComparison ? 'Change / activity' : 'Share / activity'}</span>
      </div>

      <CategoryRows
        categories={categories}
        comparisonCategories={comparisonCategories}
        comparisonLabel={comparisonLabel}
        emptyDescription={emptyDescription}
        isComparisonError={isComparisonError}
        isComparisonLoading={isComparisonLoading}
        isError={isError}
        isLoading={isLoading}
        onCategorySelect={onCategorySelect}
        total={total}
        type={type}
      />
    </div>
  );
}
