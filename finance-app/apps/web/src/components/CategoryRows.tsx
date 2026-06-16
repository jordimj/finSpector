import type { CategorySpendCategory } from '../types';
import { CategoryRow } from './CategoryRow';
import { CategoryState } from './CategoryState';

const categoryColors = [
  '#67e8f9',
  '#86efac',
  '#fbbf24',
  '#fb7185',
  '#a78bfa',
  '#60a5fa',
];

function getCategoryColor(index: number): string {
  return categoryColors[index % categoryColors.length] ?? '#67e8f9';
}

type CategoryRowsProps = {
  categories: CategorySpendCategory[];
  isError: boolean;
  isLoading: boolean;
  total: number;
};

export function CategoryRows({
  categories,
  isError,
  isLoading,
  total,
}: CategoryRowsProps) {
  if (isLoading) {
    return (
      <div className='divide-y divide-line'>
        {Array.from({ length: 6 }, (_, index) => (
          <div
            key={index}
            className='grid grid-cols-[minmax(0,1fr)_104px_60px] items-center gap-3 px-5 py-4'
          >
            <div className='min-w-0 space-y-2'>
              <div className='h-3 w-2/3 animate-pulse rounded-full bg-muted/25' />
              <div className='h-1.5 animate-pulse rounded-full bg-muted/15' />
            </div>
            <div className='h-3 animate-pulse rounded-full bg-muted/20' />
            <div className='h-3 animate-pulse rounded-full bg-muted/15' />
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
        />
      ))}
    </div>
  );
}
