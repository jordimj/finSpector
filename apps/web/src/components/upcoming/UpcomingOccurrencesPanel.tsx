import type { PaymentReminderOccurrence } from '@finance/shared';
import { Check, X } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  formatTransactionCurrency,
  formatTransactionDate,
} from '../../utils';
import { EmptyState, LoadingState } from './PanelStates';
import {
  formatOccurrenceState,
  stateStyles,
} from './reminderUi';

export function UpcomingOccurrencesPanel({
  isLoading,
  markPaidPending,
  occurrences,
  onMarkPaid,
  onSkip,
  skipPending,
}: {
  isLoading: boolean;
  markPaidPending: boolean;
  occurrences: PaymentReminderOccurrence[];
  onMarkPaid: (occurrence: PaymentReminderOccurrence) => void;
  onSkip: (occurrence: PaymentReminderOccurrence) => void;
  skipPending: boolean;
}) {
  return (
    <section className='min-h-[34rem] rounded-lg border border-line bg-panel shadow-shell'>
      <div className='flex items-start justify-between gap-4 border-b border-line px-5 py-4'>
        <div>
          <h2 className='text-xl font-semibold tracking-normal text-ink'>
            Open schedule
          </h2>
          <p className='mt-1 text-sm font-medium text-muted'>
            Due dates not marked paid or skipped
          </p>
        </div>
      </div>

      {isLoading ? (
        <LoadingState label='Loading payment schedule' />
      ) : occurrences.length === 0 ? (
        <EmptyState
          description='Confirmed reminders will appear here when they enter the upcoming window.'
          title='No open payments'
        />
      ) : (
        <div className='divide-y divide-line'>
          {occurrences.map((occurrence) => (
            <div
              key={`${occurrence.reminderId}-${occurrence.dueDate}`}
              className='grid gap-4 px-5 py-4 lg:grid-cols-[minmax(0,1fr)_auto]'
            >
              <div className='min-w-0'>
                <div className='mb-2 flex flex-wrap items-center gap-2'>
                  <span
                    className={cn(
                      'inline-flex h-6 items-center rounded-full px-2.5 text-xs font-bold uppercase tracking-[0.12em]',
                      stateStyles[occurrence.state],
                    )}
                  >
                    {formatOccurrenceState(occurrence.state)}
                  </span>
                  <span className='text-sm font-medium text-muted'>
                    {formatTransactionDate(occurrence.dueDate, {
                      includeYear: true,
                    })}
                  </span>
                </div>
                <h3 className='truncate text-base font-semibold text-ink'>
                  {occurrence.reminderName}
                </h3>
                <p className='mt-1 text-sm font-medium text-muted'>
                  {occurrence.category}
                  {occurrence.subcategory === null
                    ? ''
                    : ` / ${occurrence.subcategory}`}
                </p>
              </div>

              <div className='flex flex-wrap items-center gap-2 lg:justify-end'>
                <span className='mr-2 text-lg font-bold tabular-nums text-ink'>
                  {formatTransactionCurrency(Number(occurrence.amount))}
                </span>
                <button
                  type='button'
                  className='inline-flex h-9 items-center gap-2 rounded-md border border-line bg-panel-raised px-3 text-sm font-semibold text-muted-strong transition hover:text-accent-green disabled:cursor-not-allowed disabled:opacity-50'
                  disabled={markPaidPending}
                  onClick={() => onMarkPaid(occurrence)}
                >
                  <Check className='size-4' aria-hidden='true' />
                  Paid
                </button>
                <button
                  type='button'
                  className='inline-flex h-9 items-center gap-2 rounded-md border border-line bg-panel-raised px-3 text-sm font-semibold text-muted-strong transition hover:text-accent-rose disabled:cursor-not-allowed disabled:opacity-50'
                  disabled={skipPending}
                  onClick={() => onSkip(occurrence)}
                >
                  <X className='size-4' aria-hidden='true' />
                  Skip
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
