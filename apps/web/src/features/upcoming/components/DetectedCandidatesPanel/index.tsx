import type { PaymentReminderCandidate } from '@finance/shared';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { EmptyState } from '../PanelStates/EmptyState';
import { LoadingState } from '../PanelStates/LoadingState';
import { DetectedCandidateCard } from './DetectedCandidateCard';

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
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section className='rounded-lg border border-line bg-panel p-5 shadow-shell'>
      <button
        type='button'
        className='flex w-full items-center justify-between gap-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent-lavender'
        aria-expanded={isExpanded}
        onClick={() => setIsExpanded((current) => !current)}
      >
        <div>
          <h2 className='text-xl font-semibold tracking-normal text-ink'>
            Detected patterns
          </h2>
          <p className='mt-1 text-sm font-medium text-muted'>
            Recurring expense candidates
          </p>
        </div>
        <span className='flex shrink-0 items-center gap-2 text-accent-lavender'>
          <Sparkles className='size-5' aria-hidden='true' />
          {isExpanded ? (
            <ChevronUp className='size-4' aria-hidden='true' />
          ) : (
            <ChevronDown className='size-4' aria-hidden='true' />
          )}
        </span>
      </button>

      {isExpanded ? (
        <div className='mt-4'>
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
                <DetectedCandidateCard
                  key={candidate.key}
                  candidate={candidate}
                  onConfirm={onConfirm}
                  onDismiss={onDismiss}
                  pending={pending}
                />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
