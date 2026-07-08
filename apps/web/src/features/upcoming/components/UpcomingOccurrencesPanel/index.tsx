import type { PaymentReminderOccurrence } from '@finance/shared';
import { cn } from '../../../../lib/utils';
import { EmptyState } from '../PanelStates/EmptyState';
import { LoadingState } from '../PanelStates/LoadingState';
import { OccurrenceRow } from './OccurrenceRow';

export function UpcomingOccurrencesPanel({
  isLoading,
  markPaidPending,
  occurrences,
  onMarkPaid,
  onSkip,
  skipPending,
  className,
}: {
  className?: string;
  isLoading: boolean;
  markPaidPending: boolean;
  occurrences: PaymentReminderOccurrence[];
  onMarkPaid: (occurrence: PaymentReminderOccurrence) => void;
  onSkip: (occurrence: PaymentReminderOccurrence) => void;
  skipPending: boolean;
}) {
  return (
    <section
      className={cn(
        'flex flex-col overflow-hidden rounded-lg border border-line bg-panel shadow-shell',
        className,
      )}
    >
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
        <div className='min-h-0 flex-1 divide-y divide-line overflow-y-auto'>
          {occurrences.map((occurrence) => (
            <OccurrenceRow
              key={`${occurrence.reminderId}-${occurrence.dueDate}`}
              markPaidPending={markPaidPending}
              occurrence={occurrence}
              onMarkPaid={onMarkPaid}
              onSkip={onSkip}
              skipPending={skipPending}
            />
          ))}
        </div>
      )}
    </section>
  );
}
