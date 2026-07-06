import type { GoogleCalendarSyncStatus } from '../../../hooks/calendarSync/types';
import { formatSyncDate } from '../../../utils/date';
import { StatusCopy } from './StatusCopy';

export function StatusBody({
  isSyncing,
  status,
}: {
  isSyncing: boolean;
  status: GoogleCalendarSyncStatus;
}) {
  if (status.state === 'notConfigured') {
    return (
      <StatusCopy
        title='Setup needed'
        description='Add Google Calendar OAuth environment variables and run the API on macOS for Keychain-backed sync.'
      />
    );
  }

  if (status.state === 'notConnected') {
    return (
      <StatusCopy
        title='Not connected'
        description='Connect Google Calendar to create a dedicated FinHunter Reminders calendar.'
      />
    );
  }

  const lastSync =
    status.lastSyncedAt === null
      ? 'Never synced'
      : `Last sync ${formatSyncDate(status.lastSyncedAt)}`;
  const account =
    status.accountEmail === null
      ? 'Google account connected'
      : status.accountEmail;

  if (status.state === 'syncFailed') {
    return (
      <StatusCopy
        title='Sync needs attention'
        description={status.lastError ?? 'The last Google Calendar sync failed.'}
        detail={`${account} · ${lastSync}`}
      />
    );
  }

  return (
    <StatusCopy
      title={isSyncing ? 'Syncing reminders' : status.calendarName}
      description='FinHunter owns this calendar and may overwrite reminder events it created.'
      detail={`${account} · ${lastSync}`}
    />
  );
}
