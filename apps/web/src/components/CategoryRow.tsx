import type { TransactionType } from '@finance/shared';
import type { CategorySpend } from '../hooks/useCategorySpend';
import {
  formatCurrency,
  formatPercentage,
  formatRelativeChange,
  formatSignedCurrency,
} from '../utils';
import { getCategoryIcon } from './categoryVisuals';

type CategoryRowProps = {
  category: CategorySpend;
  comparisonCategory?: CategorySpend;
  comparisonLabel?: string;
  color: string;
  isComparisonError?: boolean;
  isComparisonLoading?: boolean;
  onSelect?: (category: CategorySpend) => void;
  type?: TransactionType;
};

export function CategoryRow({
  category,
  comparisonCategory,
  comparisonLabel,
  color,
  isComparisonError = false,
  isComparisonLoading = false,
  onSelect,
  type = 'expense',
}: CategoryRowProps) {
  const width =
    category.share > 0 ? `${Math.max(category.share * 100, 3)}%` : '0%';
  const previousWidth =
    comparisonCategory !== undefined && comparisonCategory.share > 0
      ? `${Math.max(comparisonCategory.share * 100, 3)}%`
      : '0%';
  const Icon = getCategoryIcon(category.category);
  const canSelect = onSelect !== undefined && category.id !== null;
  const showComparison = comparisonLabel !== undefined;
  const previousAmount = comparisonCategory?.totalAmount ?? 0;
  const status =
    type === 'income'
      ? category.share >= 0.25
        ? 'Major source'
        : category.share >= 0.12
          ? 'Steady income'
          : 'Small source'
      : category.share >= 0.25
        ? 'Major driver'
        : category.share >= 0.12
          ? 'Steady spend'
          : 'Low impact';
  const statusLabel = showComparison
    ? formatComparisonStatus({
        current: category.totalAmount,
        isError: isComparisonError,
        isLoading: isComparisonLoading,
        previous: previousAmount,
      })
    : status;
  const statusClassName = [
    'text-xs font-bold uppercase tracking-[0.12em]',
    showComparison
      ? getComparisonToneClass({
          current: category.totalAmount,
          isError: isComparisonError,
          isLoading: isComparisonLoading,
          previous: previousAmount,
          type,
        })
      : 'text-muted-strong',
  ].join(' ');
  const className = [
    'grid w-full gap-4 px-5 py-5 text-left transition hover:bg-panel-raised/30 md:items-center',
    showComparison
      ? 'md:grid-cols-[minmax(0,1.05fr)_minmax(7rem,0.45fr)_minmax(7rem,0.45fr)_minmax(12rem,0.95fr)]'
      : 'md:grid-cols-[minmax(0,1.15fr)_minmax(7rem,0.55fr)_minmax(12rem,0.95fr)]',
  ].join(' ');

  const content = (
    <>
      <div className='flex min-w-0 items-center gap-3'>
        <span
          className='flex size-11 shrink-0 items-center justify-center rounded-md border border-line'
          style={{
            backgroundColor: `${color}1f`,
            color,
          }}
          aria-hidden='true'
        >
          <Icon className='size-5' />
        </span>

        <div className='min-w-0'>
          <p className='truncate text-base font-semibold text-ink'>
            {category.category}
          </p>
          <p className='mt-1 text-sm font-medium text-muted'>
            {category.transactionCount} transactions
          </p>
        </div>
      </div>

      <span className='text-left text-base font-semibold tabular-nums text-ink md:text-right'>
        {showComparison ? (
          <span className='mr-2 text-sm font-medium text-muted md:hidden'>
            Current
          </span>
        ) : null}
        {formatCurrency(category.totalAmount)}
      </span>

      {showComparison ? (
        <span className='text-left text-base font-semibold tabular-nums text-muted-strong md:text-right'>
          <span className='mr-2 text-sm font-medium text-muted md:hidden'>
            Previous
          </span>
          {isComparisonLoading
            ? '...'
            : isComparisonError
              ? '--'
              : formatCurrency(previousAmount)}
        </span>
      ) : null}

      <div className='min-w-0'>
        <div className='mb-2 flex items-center justify-between gap-3'>
          <span className={statusClassName}>{statusLabel}</span>
          <span className='text-xs font-semibold tabular-nums text-muted'>
            {showComparison && !isComparisonLoading && !isComparisonError
              ? formatSignedCurrency(category.totalAmount - previousAmount)
              : formatPercentage(category.share)}
          </span>
        </div>
        <div className='relative h-2 rounded-full bg-canvas'>
          {showComparison && !isComparisonLoading && !isComparisonError ? (
            <span
              className='absolute inset-y-0 left-0 rounded-full bg-muted/25'
              style={{ width: previousWidth }}
              aria-hidden='true'
            />
          ) : null}
          <span
            className='relative block h-full rounded-full'
            style={{
              width,
              backgroundColor: color,
              boxShadow: `0 0 18px ${color}40`,
            }}
            aria-hidden='true'
          />
        </div>
      </div>
    </>
  );

  if (canSelect) {
    return (
      <button
        type='button'
        className={`${className} cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-accent-lavender`}
        onClick={() => onSelect(category)}
      >
        {content}
      </button>
    );
  }

  return <div className={className}>{content}</div>;
}

function formatComparisonStatus({
  current,
  isError,
  isLoading,
  previous,
}: {
  current: number;
  isError: boolean;
  isLoading: boolean;
  previous: number;
}): string {
  if (isLoading) {
    return 'Loading';
  }

  if (isError) {
    return 'Unavailable';
  }

  return formatRelativeChange(current, previous);
}

function getComparisonToneClass({
  current,
  isError,
  isLoading,
  previous,
  type,
}: {
  current: number;
  isError: boolean;
  isLoading: boolean;
  previous: number;
  type: TransactionType;
}): string {
  if (isLoading || isError || current === previous) {
    return 'text-muted-strong';
  }

  const delta = current - previous;
  const isPositive = type === 'income' ? delta > 0 : delta < 0;

  return isPositive ? 'text-accent-green' : 'text-accent-rose';
}
