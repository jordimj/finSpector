import { cn } from '../../../../lib/utils';
import type { TransactionTypeFilter } from '../../hooks/useTransactions';
import { transactionTypeOptions } from '../../utils/transactionFilters';

export function TransactionTypeControl({
  onSelect,
  selectedTransactionType,
}: {
  onSelect: (type: TransactionTypeFilter) => void;
  selectedTransactionType: TransactionTypeFilter;
}) {
  return (
    <div className='grid gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-strong'>
      Type
      <div
        className='grid h-10 grid-cols-3 rounded-md border border-line bg-panel-raised p-1 shadow-shell'
        role='group'
        aria-label='Transaction type'
      >
        {transactionTypeOptions.map((option) => {
          const isSelected = option.key === selectedTransactionType;

          return (
            <button
              key={option.key}
              type='button'
              className={cn(
                'rounded px-2 text-sm font-semibold normal-case tracking-normal transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-lavender',
                isSelected
                  ? 'bg-accent-lavender text-white shadow-sm'
                  : 'text-muted-strong hover:text-ink',
              )}
              aria-pressed={isSelected}
              onClick={() => onSelect(option.key)}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
