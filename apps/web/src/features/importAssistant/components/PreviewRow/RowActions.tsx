import { Ban, CheckCircle2, RotateCcw } from 'lucide-react';
import { cn } from '../../../../lib/utils';

export function RowActions({
  canReset,
  index,
  isReviewed,
  isSkipped,
  onMarkReviewed,
  onReset,
  onToggleSkipped,
}: {
  canReset: boolean;
  index: number;
  isReviewed: boolean;
  isSkipped: boolean;
  onMarkReviewed: (index: number) => void;
  onReset: (index: number) => void;
  onToggleSkipped: (index: number) => void;
}) {
  return (
    <span className='flex justify-end gap-1.5'>
      <button
        className={cn(
          'inline-flex size-8 items-center justify-center rounded-md border border-line bg-panel-raised text-muted-strong transition hover:text-ink disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-lavender',
          isReviewed &&
            !isSkipped &&
            'border-accent-green/30 bg-accent-green/15 text-accent-green hover:text-accent-green',
        )}
        disabled={isSkipped}
        onClick={() => onMarkReviewed(index)}
        title={
          isSkipped
            ? 'Skipped rows are excluded from CSV'
            : isReviewed
              ? 'Row reviewed'
              : 'Mark row as reviewed'
        }
        type='button'
        aria-label={isReviewed ? 'Row reviewed' : 'Mark row as reviewed'}
      >
        <CheckCircle2 className='size-4' aria-hidden='true' />
      </button>
      <button
        className={cn(
          'inline-flex size-8 items-center justify-center rounded-md border border-line bg-panel-raised text-muted-strong transition hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-lavender',
          isSkipped &&
            'border-accent-rose/30 bg-accent-rose/10 text-accent-rose hover:text-accent-rose',
        )}
        onClick={() => onToggleSkipped(index)}
        title={isSkipped ? 'Include this row in CSV' : 'Skip this row in CSV'}
        type='button'
        aria-label={isSkipped ? 'Include this row in CSV' : 'Skip this row in CSV'}
      >
        <Ban className='size-4' aria-hidden='true' />
      </button>
      <button
        className='inline-flex size-8 items-center justify-center rounded-md border border-line bg-panel-raised text-muted-strong transition hover:text-ink disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-lavender'
        disabled={isSkipped || !canReset}
        onClick={() => onReset(index)}
        title={
          isSkipped
            ? 'Include this row before resetting'
            : canReset
              ? 'Reset row review'
              : 'No reviewed changes to reset'
        }
        type='button'
        aria-label='Reset row review'
      >
        <RotateCcw className='size-4' aria-hidden='true' />
      </button>
    </span>
  );
}
