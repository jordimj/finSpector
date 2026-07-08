import { CalendarClock } from 'lucide-react';
import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useUpcomingPaymentReminders } from '../../../../upcoming/hooks/paymentReminders/useUpcomingPaymentReminders';
import { buildScheduledPaymentRows } from '../../../utils/buildScheduledPaymentRows';
import type { ProjectionMonth } from '../../../hooks/useProjection';
import { ScheduledPaymentTile } from './ScheduledPaymentTile';

type ScheduledPaymentsPanelProps = {
  isProjectionLoading: boolean;
  months: ProjectionMonth[];
};

export function ScheduledPaymentsPanel({
  isProjectionLoading,
  months,
}: ScheduledPaymentsPanelProps) {
  const upcomingPayments = useUpcomingPaymentReminders(365);
  const scheduledRows = useMemo(
    () =>
      buildScheduledPaymentRows({
        months,
        occurrences: upcomingPayments.data?.occurrences ?? [],
      }),
    [months, upcomingPayments.data?.occurrences],
  );

  return (
    <section className='mt-8 rounded-lg border border-line bg-panel p-5 shadow-shell'>
      <div className='mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
        <div>
          <h2 className='text-xl font-semibold tracking-normal text-ink'>
            Scheduled payments
          </h2>
          <p className='mt-1 text-sm font-medium text-muted'>
            Reminder dates shown alongside projection months
          </p>
        </div>
        <Link
          to='/upcoming'
          className='inline-flex h-9 items-center justify-center gap-2 rounded-md border border-line bg-panel-raised px-3 text-sm font-semibold text-muted-strong transition hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-lavender'
        >
          <CalendarClock className='size-4' aria-hidden='true' />
          Upcoming
        </Link>
      </div>

      {isProjectionLoading || upcomingPayments.isLoading ? (
        <p className='rounded-md bg-canvas/70 px-3 py-3 text-sm font-medium text-muted-strong'>
          Loading scheduled payments.
        </p>
      ) : upcomingPayments.isError ? (
        <p className='rounded-md bg-accent-rose/10 px-3 py-3 text-sm font-medium text-muted-strong'>
          Scheduled payments are unavailable.
        </p>
      ) : scheduledRows.length === 0 ? (
        <p className='rounded-md bg-canvas/70 px-3 py-3 text-sm font-medium text-muted-strong'>
          No confirmed payment reminders land inside this projection window.
        </p>
      ) : (
        <div className='grid gap-3 md:grid-cols-2 xl:grid-cols-4'>
          {scheduledRows.map((row) => (
            <ScheduledPaymentTile key={row.month} row={row} />
          ))}
        </div>
      )}
    </section>
  );
}
