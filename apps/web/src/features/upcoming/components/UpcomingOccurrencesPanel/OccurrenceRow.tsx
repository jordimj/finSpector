import type { PaymentReminderOccurrence } from '@finance/shared';
import { Check, X } from 'lucide-react';
import { cn } from '../../../../lib/utils';
import {
  formatTransactionCurrency,
  formatTransactionDate,
} from '../../../../utils';
import {
  formatCadenceLabel,
  formatOccurrenceState,
  stateStyles,
} from '../../utils/reminderUi';

export function OccurrenceRow({
  markPaidPending,
  occurrence,
  onMarkPaid,
  onSkip,
  skipPending,
}: {
  markPaidPending: boolean;
  occurrence: PaymentReminderOccurrence;
  onMarkPaid: (occurrence: PaymentReminderOccurrence) => void;
  onSkip: (occurrence: PaymentReminderOccurrence) => void;
  skipPending: boolean;
}) {
  return (
    <div className='grid gap-4 px-5 py-4 lg:grid-cols-[minmax(0,1fr)_auto]'>
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
          <span className='inline-flex h-6 items-center rounded-full bg-panel-raised px-2.5 text-xs font-bold uppercase tracking-[0.12em] text-muted-strong'>
            {formatCadenceLabel(occurrence.cadence)}
          </span>
        </div>
        <h3 className='truncate text-base font-semibold text-ink'>
          {occurrence.reminderName}
        </h3>
        <p className='mt-1 text-sm font-medium text-muted'>
          {occurrence.category}
          {occurrence.subcategory === null ? '' : ` / ${occurrence.subcategory}`}
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
  );
}
