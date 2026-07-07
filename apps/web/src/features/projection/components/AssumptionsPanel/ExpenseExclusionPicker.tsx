import { Plus } from 'lucide-react';
import { useState } from 'react';
import type { Category } from '../../../../hooks/useCategories';
import type { ProjectionExpenseExclusion } from '../../hooks/useProjection';
import type { ProjectionCustomExpenseExclusion } from '../../hooks/useProjectionSettings';
import { buildExpenseExclusionOptions } from '../../utils/expenseExclusionOptions';

type ExpenseExclusionPickerProps = {
  categories: Category[];
  exclusions: ProjectionExpenseExclusion[];
  isLoading: boolean;
  onAdd: (exclusion: ProjectionCustomExpenseExclusion) => void;
};

export function ExpenseExclusionPicker({
  categories,
  exclusions,
  isLoading,
  onAdd,
}: ExpenseExclusionPickerProps) {
  const [selectedValue, setSelectedValue] = useState('');
  const options = buildExpenseExclusionOptions(categories, exclusions);
  const selectedOption =
    options.find((option) => option.value === selectedValue) ?? options[0];
  const selectValue = selectedOption?.value ?? '';

  return (
    <div className='rounded-md border border-line bg-canvas/70 p-3'>
      <div className='flex flex-col gap-2 sm:flex-row'>
        <select
          className='h-10 min-w-0 flex-1 rounded-md border border-line bg-panel px-3 text-sm font-semibold text-ink outline-none transition focus:border-accent-lavender disabled:cursor-not-allowed disabled:opacity-60'
          aria-label='Expense category to exclude'
          disabled={isLoading || options.length === 0}
          value={selectValue}
          onChange={(event) => setSelectedValue(event.currentTarget.value)}
        >
          {isLoading ? (
            <option>Loading categories...</option>
          ) : options.length === 0 ? (
            <option>No categories left to add</option>
          ) : (
            options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))
          )}
        </select>

        <button
          type='button'
          className='inline-flex h-10 items-center justify-center gap-2 rounded-md border border-line bg-panel px-3 text-sm font-semibold text-muted-strong transition hover:text-ink disabled:cursor-not-allowed disabled:opacity-50'
          aria-label='Add expense exclusion'
          disabled={selectedOption === undefined}
          onClick={() => {
            if (selectedOption === undefined) {
              return;
            }

            onAdd(selectedOption.exclusion);
            setSelectedValue('');
          }}
        >
          <Plus className='size-4' aria-hidden='true' />
          Add
        </button>
      </div>
    </div>
  );
}
