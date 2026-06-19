import type { CategorySpend } from '../hooks/useCategorySpend';
import { getCategoryColor } from './categoryVisuals';
import { CategoryRow } from './CategoryRow';
import { CategoryState } from './CategoryState';
import type { TransactionType } from '@finance/shared';

type CategoryRowsProps = {
  categories: CategorySpend[];
  comparisonCategories?: CategorySpend[];
  comparisonLabel?: string;
  emptyDescription?: string;
  isComparisonError?: boolean;
  isComparisonLoading?: boolean;
  isError: boolean;
  isLoading: boolean;
  onCategorySelect?: (category: CategorySpend) => void;
  total: number;
  type?: TransactionType;
};

export function CategoryRows({
  categories,
  comparisonCategories,
  comparisonLabel,
  emptyDescription = 'Imported expenses will show up here.',
  isComparisonError = false,
  isComparisonLoading = false,
  isError,
  isLoading,
  onCategorySelect,
  total,
  type = 'expense',
}: CategoryRowsProps) {
  const showComparison = comparisonLabel !== undefined;
  const categoryRows = buildCategoryRows({
    categories,
    comparisonCategories,
    includeComparisonOnly:
      showComparison && !isComparisonLoading && !isComparisonError,
  });
  const hasRows = categoryRows.some(
    ({ category, comparisonCategory }) =>
      category.totalAmount > 0 || (comparisonCategory?.totalAmount ?? 0) > 0,
  );

  if (isLoading) {
    return (
      <div className='divide-y divide-line'>
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className='grid gap-4 px-5 py-5 md:grid-cols-[minmax(0,1.15fr)_minmax(7rem,0.55fr)_minmax(12rem,0.95fr)] md:items-center'
          >
            <div className='flex min-w-0 items-center gap-3'>
              <div className='size-11 animate-pulse rounded-md bg-muted/15' />
              <div className='min-w-0 flex-1 space-y-2'>
                <div className='h-3 w-2/3 animate-pulse rounded-full bg-muted/25' />
                <div className='h-2 w-1/2 animate-pulse rounded-full bg-muted/15' />
              </div>
            </div>
            <div className='h-4 animate-pulse rounded-full bg-muted/20' />
            <div className='space-y-2'>
              <div className='h-3 w-1/2 animate-pulse rounded-full bg-muted/20' />
              <div className='h-2 animate-pulse rounded-full bg-muted/15' />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <CategoryState>
        <p className='text-sm font-medium text-ink'>
          Unable to load categories
        </p>
        <p className='mt-1 text-xs text-muted'>
          Check that the API is running and try again.
        </p>
      </CategoryState>
    );
  }

  if (!hasRows || (total <= 0 && !showComparison)) {
    return (
      <CategoryState>
        <p className='text-sm font-medium text-ink'>No categories yet</p>
        <p className='mt-1 text-xs text-muted'>{emptyDescription}</p>
      </CategoryState>
    );
  }

  return (
    <div className='divide-y divide-line'>
      {categoryRows.map(({ category, comparisonCategory }, index) => (
        <CategoryRow
          key={category.id ?? category.category}
          category={category}
          comparisonCategory={comparisonCategory}
          comparisonLabel={comparisonLabel}
          color={getCategoryColor(index)}
          isComparisonError={isComparisonError}
          isComparisonLoading={isComparisonLoading}
          onSelect={onCategorySelect}
          type={type}
        />
      ))}
    </div>
  );
}

type CategoryRowComparison = {
  category: CategorySpend;
  comparisonCategory?: CategorySpend;
};

function buildCategoryRows({
  categories,
  comparisonCategories,
  includeComparisonOnly,
}: {
  categories: CategorySpend[];
  comparisonCategories: CategorySpend[] | undefined;
  includeComparisonOnly: boolean;
}): CategoryRowComparison[] {
  const comparisonByKey = new Map(
    comparisonCategories?.map((category) => [
      getCategoryComparisonKey(category),
      category,
    ]) ?? [],
  );
  const categoryKeys = new Set<string>();
  const rows = categories.map((category) => {
    const key = getCategoryComparisonKey(category);
    categoryKeys.add(key);

    return {
      category,
      comparisonCategory: comparisonByKey.get(key),
    };
  });

  if (!includeComparisonOnly || comparisonCategories === undefined) {
    return rows;
  }

  return [
    ...rows,
    ...comparisonCategories.flatMap((comparisonCategory) => {
      const key = getCategoryComparisonKey(comparisonCategory);

      if (categoryKeys.has(key)) {
        return [];
      }

      return [
        {
          category: {
            ...comparisonCategory,
            share: 0,
            total: '0.00',
            totalAmount: 0,
            transactionCount: 0,
          },
          comparisonCategory,
        },
      ];
    }),
  ];
}

function getCategoryComparisonKey(category: CategorySpend): string {
  return category.id === null
    ? `name:${category.category.toLocaleLowerCase()}`
    : `id:${category.id}`;
}
