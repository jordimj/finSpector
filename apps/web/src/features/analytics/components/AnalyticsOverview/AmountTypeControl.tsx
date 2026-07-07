import type { TransactionType } from '@finance/shared';
import { cn } from '../../../../lib/utils';
import { categoryAmountTypes } from '../../utils/categoryAmountTypes';

type AmountTypeControlProps = {
  categoryAmountType: TransactionType;
  onCategoryAmountTypeChange: (type: TransactionType) => void;
};

export function AmountTypeControl({
  categoryAmountType,
  onCategoryAmountTypeChange,
}: AmountTypeControlProps) {
  return (
    <div
      className='inline-flex h-10 rounded-md border border-line bg-panel-raised p-1 shadow-shell'
      role='group'
      aria-label='Category amount type'
    >
      {categoryAmountTypes.map((option) => {
        const isSelected = option.key === categoryAmountType;

        return (
          <button
            key={option.key}
            type='button'
            className={cn(
              'rounded px-3 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-lavender',
              isSelected
                ? 'bg-accent-lavender text-white shadow-sm'
                : 'text-muted-strong hover:text-ink',
            )}
            aria-pressed={isSelected}
            onClick={() => onCategoryAmountTypeChange(option.key)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
