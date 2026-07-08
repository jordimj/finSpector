import type { PaymentReminderCandidate } from '@finance/shared';
import { Check, X } from 'lucide-react';
import { formatTransactionCurrency } from '../../../../utils';
import { formatCadenceLabel } from '../../utils/reminderUi';

export function DetectedCandidateCard({
  candidate,
  onConfirm,
  onDismiss,
  pending,
}: {
  candidate: PaymentReminderCandidate;
  onConfirm: (candidate: PaymentReminderCandidate) => void;
  onDismiss: (candidate: PaymentReminderCandidate) => void;
  pending: boolean;
}) {
  return (
    <div className='rounded-md bg-canvas/70 p-3'>
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <p className='truncate text-sm font-semibold text-ink'>
            {candidate.name}
          </p>
          <p className='mt-1 text-xs font-medium text-muted'>
            {formatCadenceLabel(candidate.cadence)} · {candidate.monthCount}{' '}
            months · {Math.round(candidate.confidence * 100)}%
          </p>
          <p className='mt-1 truncate text-xs font-medium text-muted-strong'>
            {candidate.category}
            {candidate.subcategory === null
              ? ''
              : ` / ${candidate.subcategory}`}
          </p>
        </div>
        <span className='shrink-0 text-sm font-bold tabular-nums text-muted-strong'>
          {formatTransactionCurrency(Number(candidate.amount))}
        </span>
      </div>
      <div className='mt-3 flex flex-wrap gap-2'>
        <button
          type='button'
          className='inline-flex h-9 items-center gap-2 rounded-md border border-line bg-panel px-3 text-sm font-semibold text-muted-strong transition hover:text-accent-green disabled:cursor-not-allowed disabled:opacity-50'
          disabled={pending}
          onClick={() => onConfirm(candidate)}
        >
          <Check className='size-4' aria-hidden='true' />
          Confirm
        </button>
        <button
          type='button'
          className='inline-flex h-9 items-center gap-2 rounded-md border border-line bg-panel px-3 text-sm font-semibold text-muted-strong transition hover:text-accent-rose disabled:cursor-not-allowed disabled:opacity-50'
          disabled={pending}
          onClick={() => onDismiss(candidate)}
        >
          <X className='size-4' aria-hidden='true' />
          Dismiss
        </button>
      </div>
    </div>
  );
}
