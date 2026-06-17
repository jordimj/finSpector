import type { CategorySpendCategory } from '../types';
import { getCategoryColor } from './categoryVisuals';
import { CategoryRow } from './CategoryRow';
import { CategoryState } from './CategoryState';

type CategoryRowsProps = {
  categories: CategorySpendCategory[];
  isError: boolean;
  isLoading: boolean;
  onCategorySelect?: (category: CategorySpendCategory) => void;
  total: number;
};

export function CategoryRows({
  categories,
  isError,
  isLoading,
  onCategorySelect,
  total,
}: CategoryRowsProps) {
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

  if (categories.length === 0 || total <= 0) {
    return (
      <CategoryState>
        <p className='text-sm font-medium text-ink'>No categories yet</p>
        <p className='mt-1 text-xs text-muted'>
          Imported expenses will show up here.
        </p>
      </CategoryState>
    );
  }

  return (
    <div className='divide-y divide-line'>
      {categories.map((category, index) => (
        <CategoryRow
          key={category.id ?? category.category}
          category={category}
          color={getCategoryColor(index)}
          onSelect={onCategorySelect}
        />
      ))}
    </div>
  );
}
