import type { PaymentReminderCandidate } from '@finance/shared';
import { Check, Sparkles, X } from 'lucide-react';
import { formatTransactionCurrency } from '../../utils';
import { EmptyState, LoadingState } from './PanelStates';
import { formatCadenceLabel } from './reminderUi';

export function DetectedCandidatesPanel({
  candidates,
  isLoading,
  onConfirm,
  onDismiss,
  pending,
}: {
  candidates: PaymentReminderCandidate[];
  isLoading: boolean;
  onConfirm: (candidate: PaymentReminderCandidate) => void;
  onDismiss: (candidate: PaymentReminderCandidate) => void;
  pending: boolean;
}) {
  return (
    <section className='rounded-lg border border-line bg-panel p-5 shadow-shell'>
      <div className='mb-4 flex items-center justify-between gap-4'>
        <div>
          <h2 className='text-xl font-semibold tracking-normal text-ink'>
            Detected patterns
          </h2>
          <p className='mt-1 text-sm font-medium text-muted'>
            Recurring expense candidates
          </p>
        </div>
        <Sparkles className='size-5 shrink-0 text-accent-lavender' />
      </div>

      {isLoading ? (
        <LoadingState label='Finding recurring payments' compact />
      ) : candidates.length === 0 ? (
        <EmptyState
          compact
          description='No new recurring candidates found.'
          title='Nothing detected'
        />
      ) : (
        <div className='space-y-3'>
          {candidates.map((candidate) => (
            <div key={candidate.key} className='rounded-md bg-canvas/70 p-3'>
              <div className='flex items-start justify-between gap-3'>
                <div className='min-w-0'>
                  <p className='truncate text-sm font-semibold text-ink'>
                    {candidate.name}
                  </p>
                  <p className='mt-1 text-xs font-medium text-muted'>
                    {formatCadenceLabel(candidate.cadence)} ·{' '}
                    {candidate.monthCount} months ·{' '}
                    {Math.round(candidate.confidence * 100)}%
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
          ))}
        </div>
      )}
    </section>
  );
}
