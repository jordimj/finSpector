import { Bell, CalendarClock, CircleAlert, Sparkles } from 'lucide-react';
import { SummaryTile } from '../SummaryTile';
import type { UpcomingPaymentSummary } from '../../hooks/paymentReminders/types';
import { formatTransactionCurrency } from '../../utils';

export function UpcomingSummaryTiles({
  candidatesLoading,
  suggestionCount,
  summary,
  upcomingLoading,
}: {
  candidatesLoading: boolean;
  suggestionCount: number;
  summary?: UpcomingPaymentSummary;
  upcomingLoading: boolean;
}) {
  return (
    <div className='grid gap-5 md:grid-cols-2 xl:grid-cols-4'>
      <SummaryTile
        badge='Overdue'
        detail='Open missed due dates'
        footer='Needs review'
        icon={<CircleAlert className='size-5' aria-hidden='true' />}
        label='Overdue'
        tone='rose'
        value={upcomingLoading ? '...' : String(summary?.overdueCount ?? 0)}
      />
      <SummaryTile
        badge='Due soon'
        detail='Inside each reminder lead window'
        footer='This window'
        icon={<Bell className='size-5' aria-hidden='true' />}
        label='Due soon'
        tone='lavender'
        value={upcomingLoading ? '...' : String(summary?.dueSoonCount ?? 0)}
      />
      <SummaryTile
        badge='Open'
        detail='Overdue, due soon, and upcoming'
        footer='Unpaid total'
        icon={<CalendarClock className='size-5' aria-hidden='true' />}
        label='Open amount'
        tone='green'
        value={
          upcomingLoading
            ? '...'
            : formatTransactionCurrency(Number(summary?.totalOpenAmount ?? 0))
        }
      />
      <SummaryTile
        badge='Detected'
        detail='Recurring patterns ready to confirm'
        footer='Suggestions'
        icon={<Sparkles className='size-5' aria-hidden='true' />}
        label='Suggestions'
        tone='lavender'
        value={candidatesLoading ? '...' : String(suggestionCount)}
      />
    </div>
  );
}
