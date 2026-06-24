import { DEFAULT_PAYMENT_REMINDER_HORIZON_DAYS } from '@finance/shared';
import { CalendarClock, CircleAlert, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { isOpenOccurrence } from './upcoming/reminderUi';
import { useUpcomingPaymentReminders } from '../hooks/paymentReminders/useUpcomingPaymentReminders';
import {
  formatTransactionCurrency,
  formatTransactionDate,
} from '../utils';

export function UpcomingPaymentsCard() {
  const upcoming = useUpcomingPaymentReminders();
  const occurrences = upcoming.data?.occurrences ?? [];
  const openOccurrences = occurrences.filter(isOpenOccurrence);
  const previewOccurrences = openOccurrences.slice(0, 4);
  const summary = upcoming.data?.summary;

  return (
    <section className='rounded-lg border border-line bg-panel p-5 shadow-shell'>
      <div className='mb-5 flex items-start justify-between gap-4'>
        <div>
          <h2 className='text-xl font-semibold tracking-normal text-ink'>
            Upcoming payments
          </h2>
          <p className='mt-1 text-sm font-medium text-muted'>
            Due and overdue reminders for the next{' '}
            {DEFAULT_PAYMENT_REMINDER_HORIZON_DAYS} days
          </p>
        </div>
        <Link
          to='/upcoming'
          className='inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-line bg-panel-raised px-3 text-sm font-semibold text-muted-strong transition hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-lavender'
        >
          Open
        </Link>
      </div>

      {upcoming.isLoading ? (
        <div className='flex min-h-32 items-center justify-center text-sm font-medium text-muted'>
          <Loader2 className='mr-2 size-4 animate-spin' aria-hidden='true' />
          Loading reminders
        </div>
      ) : upcoming.isError ? (
        <CardNotice
          description='Check that the API is running and migrations are applied.'
          title='Reminders unavailable'
        />
      ) : openOccurrences.length === 0 ? (
        <div className='rounded-md border border-line bg-canvas/70 p-4 text-sm font-medium text-muted-strong'>
          No open payments in the next 30 days.
        </div>
      ) : (
        <div className='grid gap-4 xl:grid-cols-[14rem_minmax(0,1fr)]'>
          <div className='rounded-md border border-line bg-canvas/70 p-4'>
            <div className='flex items-center gap-2 text-accent-cyan'>
              <CalendarClock className='size-4' aria-hidden='true' />
              <span className='text-xs font-bold uppercase tracking-[0.12em]'>
                Open amount
              </span>
            </div>
            <p className='mt-3 text-2xl font-bold tabular-nums text-ink'>
              {formatTransactionCurrency(Number(summary?.totalOpenAmount ?? 0))}
            </p>
            <p className='mt-2 text-sm font-medium text-muted'>
              {summary?.overdueCount ?? 0} overdue,{' '}
              {summary?.dueSoonCount ?? 0} due soon
            </p>
          </div>

          <div className='min-w-0 space-y-2'>
            {previewOccurrences.map((occurrence) => (
              <Link
                key={`${occurrence.reminderId}-${occurrence.dueDate}`}
                to='/upcoming'
                className='flex items-center justify-between gap-3 rounded-md bg-canvas/70 px-3 py-2 transition hover:bg-canvas'
              >
                <span className='min-w-0'>
                  <span className='block truncate text-sm font-semibold text-ink'>
                    {occurrence.reminderName}
                  </span>
                  <span className='mt-0.5 block text-xs font-medium text-muted'>
                    {formatTransactionDate(occurrence.dueDate, {
                      includeYear: true,
                    })}
                  </span>
                </span>
                <span className='shrink-0 text-sm font-bold tabular-nums text-muted-strong'>
                  {formatTransactionCurrency(Number(occurrence.amount))}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function CardNotice({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <div className='rounded-md border border-accent-rose/35 bg-accent-rose/10 p-4'>
      <div className='flex gap-3'>
        <CircleAlert className='mt-0.5 size-5 shrink-0 text-accent-rose' />
        <div>
          <p className='text-sm font-semibold text-ink'>{title}</p>
          <p className='mt-1 text-sm font-medium text-muted-strong'>
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
