import { Check, Trash2 } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import type { ProjectionExpenseExclusion } from '../../hooks/useProjection';
import { getExclusionLabel } from '../../utils/assumptionDisplay';

type EditableExclusionRowProps = {
  exclusion: ProjectionExpenseExclusion;
  onRemove: (exclusionId: string) => void;
  onToggle: (exclusionKey: string, active: boolean) => void;
};

export function EditableExclusionRow({
  exclusion,
  onRemove,
  onToggle,
}: EditableExclusionRowProps) {
  if (exclusion.custom) {
    return (
      <div className='flex items-start gap-3 rounded-md bg-canvas/70 px-3 py-2'>
        <span
          className='mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border border-accent-cyan bg-accent-cyan text-canvas'
          aria-hidden='true'
        >
          <Check className='size-3.5' />
        </span>
        <span className='min-w-0 flex-1'>
          <span className='block truncate text-sm font-semibold text-ink'>
            {getExclusionLabel(exclusion)}
          </span>
          <span className='mt-0.5 block text-xs font-medium text-muted'>
            {exclusion.missing
              ? 'Not found in categories'
              : 'Added from categories'}
          </span>
        </span>
        <button
          type='button'
          className='flex size-8 shrink-0 items-center justify-center rounded-md border border-line bg-panel text-muted-strong transition hover:text-accent-rose focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-lavender'
          aria-label={`Remove ${getExclusionLabel(exclusion)}`}
          disabled={exclusion.customId === undefined}
          onClick={() => {
            if (exclusion.customId !== undefined) {
              onRemove(exclusion.customId);
            }
          }}
        >
          <Trash2 className='size-4' aria-hidden='true' />
        </button>
      </div>
    );
  }

  return (
    <label className='flex cursor-pointer items-start gap-3 rounded-md bg-canvas/70 px-3 py-2 transition hover:bg-canvas'>
      <input
        type='checkbox'
        className='peer sr-only'
        checked={exclusion.active}
        onChange={(event) =>
          onToggle(exclusion.key, event.currentTarget.checked)
        }
      />
      <span
        className={cn(
          'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border border-line bg-panel text-transparent transition peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent-lavender',
          exclusion.active && 'border-accent-cyan bg-accent-cyan text-canvas',
        )}
        aria-hidden='true'
      >
        <Check className='size-3.5' />
      </span>
      <span className='min-w-0'>
        <span className='block truncate text-sm font-semibold text-ink'>
          {getExclusionLabel(exclusion)}
        </span>
        <span className='mt-0.5 block text-xs font-medium text-muted'>
          {exclusion.missing
            ? 'Not found in categories'
            : exclusion.active
              ? 'Excluded from baseline'
              : 'Included in baseline'}
        </span>
      </span>
    </label>
  );
}
