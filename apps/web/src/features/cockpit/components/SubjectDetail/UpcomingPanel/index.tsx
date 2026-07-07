import { CalendarClock } from 'lucide-react';
import type { PaymentReminderOccurrence } from '@finance/shared';
import { formatCurrency, formatTransactionDate } from '../../../../../utils';
import {
  formatOccurrenceState,
  getOccurrenceStateClass,
} from '../../../utils/occurrenceDisplay';

type UpcomingPanelProps = {
  isError: boolean;
  isLoading: boolean;
  occurrences: PaymentReminderOccurrence[];
};

export function UpcomingPanel({
  isError,
  isLoading,
  occurrences,
}: UpcomingPanelProps) {
  return (
    <div className='rounded-lg border border-line bg-panel p-5 shadow-shell'>
      <div className='mb-5 flex items-start justify-between gap-3'>
        <div>
          <h2 className='text-xl font-semibold tracking-normal text-ink'>
            Upcoming payments
          </h2>
          <p className='mt-1 text-sm font-medium text-muted'>
            Scoped reminders in the selected period
          </p>
        </div>
        <span className='flex size-9 shrink-0 items-center justify-center rounded-full border border-accent-cyan/35 text-accent-cyan'>
          <CalendarClock className='size-5' aria-hidden='true' />
        </span>
      </div>

      {isLoading ? (
        <div className='space-y-3'>
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className='h-16 animate-pulse rounded-md bg-canvas/70'
            />
          ))}
        </div>
      ) : isError ? (
        <p className='rounded-md bg-accent-rose/10 px-3 py-3 text-sm font-medium text-muted-strong'>
          Upcoming payments are unavailable.
        </p>
      ) : occurrences.length === 0 ? (
        <p className='rounded-md bg-canvas/70 px-3 py-3 text-sm font-medium text-muted-strong'>
          No scoped payment reminders in this period.
        </p>
      ) : (
        <div className='divide-y divide-line overflow-hidden rounded-md border border-line bg-canvas/70'>
          {occurrences.map((occurrence) => (
            <div
              key={`${occurrence.reminderId}:${occurrence.dueDate}`}
              className='grid gap-3 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center'
            >
              <div className='min-w-0'>
                <p className='truncate text-sm font-semibold text-ink'>
                  {occurrence.reminderName}
                </p>
                <p className='mt-1 text-xs font-medium text-muted'>
                  {occurrence.category}
                  {occurrence.subcategory === null
                    ? ''
                    : ` / ${occurrence.subcategory}`}
                </p>
              </div>
              <span className={getOccurrenceStateClass(occurrence.state)}>
                {formatOccurrenceState(occurrence.state)}
              </span>
              <div className='text-left sm:text-right'>
                <p className='text-sm font-bold tabular-nums text-ink'>
                  {formatCurrency(Number(occurrence.amount))}
                </p>
                <p className='mt-1 text-xs font-medium text-muted'>
                  {formatTransactionDate(occurrence.dueDate)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
