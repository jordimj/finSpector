import {
  CalendarClock,
  CheckCircle2,
  CircleAlert,
  Loader2,
} from 'lucide-react';
import type { GoogleCalendarSyncStatus } from '../../hooks/calendarSync/types';

export function StatusIcon({
  isLoading,
  status,
}: {
  isLoading: boolean;
  status: GoogleCalendarSyncStatus | undefined;
}) {
  if (isLoading) {
    return <Loader2 className='size-5 animate-spin text-muted' />;
  }

  if (status?.state === 'connected') {
    return <CheckCircle2 className='size-5 text-accent-green' />;
  }

  if (status?.state === 'syncFailed' || status?.state === 'notConfigured') {
    return <CircleAlert className='size-5 text-accent-amber' />;
  }

  return <CalendarClock className='size-5 text-accent-cyan' />;
}
