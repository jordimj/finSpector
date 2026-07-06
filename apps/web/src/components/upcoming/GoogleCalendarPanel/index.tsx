import { Link, Loader2, RefreshCcw, Trash2, Unlink } from 'lucide-react';
import { useConnectGoogleCalendar } from '../../../hooks/calendarSync/useConnectGoogleCalendar';
import { useDeleteGoogleCalendarEvents } from '../../../hooks/calendarSync/useDeleteGoogleCalendarEvents';
import { useDisconnectGoogleCalendar } from '../../../hooks/calendarSync/useDisconnectGoogleCalendar';
import { useGoogleCalendarSyncStatus } from '../../../hooks/calendarSync/useGoogleCalendarSyncStatus';
import { useSyncGoogleCalendar } from '../../../hooks/calendarSync/useSyncGoogleCalendar';
import { PanelButton } from './PanelButton';
import { StatusBody } from './StatusBody';
import { StatusCopy } from './StatusCopy';
import { StatusIcon } from './StatusIcon';

export function GoogleCalendarPanel() {
  const status = useGoogleCalendarSyncStatus();
  const connect = useConnectGoogleCalendar();
  const deleteEvents = useDeleteGoogleCalendarEvents();
  const disconnect = useDisconnectGoogleCalendar();
  const sync = useSyncGoogleCalendar();
  const data = status.data;
  const isBusy =
    connect.isPending ||
    deleteEvents.isPending ||
    disconnect.isPending ||
    sync.isPending;
  const isConnected =
    data?.state === 'connected' ||
    data?.state === 'needsSync' ||
    data?.state === 'syncFailed';

  function handleConnect() {
    connect.mutate(undefined, {
      onSuccess: (response) => {
        window.location.assign(response.authorizationUrl);
      },
    });
  }

  function handleDeleteEvents() {
    if (
      typeof window !== 'undefined' &&
      !window.confirm(
        'Delete all events in FinHunter Reminders only? This leaves your reminders and Google Calendar connection intact.',
      )
    ) {
      return;
    }

    deleteEvents.mutate();
  }

  return (
    <section className='rounded-lg border border-line bg-panel p-5 shadow-shell'>
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <h2 className='text-xl font-semibold tracking-normal text-ink'>
            Google Calendar
          </h2>
          <p className='mt-1 text-sm font-medium text-muted'>
            Push open reminders to a dedicated calendar
          </p>
        </div>
        <StatusIcon status={data} isLoading={status.isLoading || isBusy} />
      </div>

      <div className='mt-4 rounded-md border border-line bg-canvas/70 p-4'>
        {status.isLoading ? (
          <p className='flex items-center text-sm font-medium text-muted'>
            <Loader2 className='mr-2 size-4 animate-spin' aria-hidden='true' />
            Checking connection
          </p>
        ) : status.isError || data === undefined ? (
          <StatusCopy
            title='Calendar sync unavailable'
            description='Check that the API is running and the calendar sync migration has been applied.'
          />
        ) : (
          <StatusBody status={data} isSyncing={sync.isPending} />
        )}
      </div>

      <div className='mt-4 flex flex-wrap gap-2'>
        {data?.state === 'notConnected' ? (
          <PanelButton
            disabled={isBusy}
            icon={
              connect.isPending ? (
                <Loader2 className='size-4 animate-spin' aria-hidden='true' />
              ) : (
                <Link className='size-4' aria-hidden='true' />
              )
            }
            onClick={handleConnect}
          >
            Connect
          </PanelButton>
        ) : null}

        {isConnected ? (
          <>
            <PanelButton
              disabled={isBusy}
              icon={
                sync.isPending ? (
                  <Loader2 className='size-4 animate-spin' aria-hidden='true' />
                ) : (
                  <RefreshCcw className='size-4' aria-hidden='true' />
                )
              }
              onClick={() => sync.mutate()}
            >
              Sync now
            </PanelButton>
            <PanelButton
              disabled={isBusy}
              icon={
                deleteEvents.isPending ? (
                  <Loader2 className='size-4 animate-spin' aria-hidden='true' />
                ) : (
                  <Trash2 className='size-4' aria-hidden='true' />
                )
              }
              onClick={handleDeleteEvents}
              variant='danger'
            >
              Delete all
            </PanelButton>
            <PanelButton
              disabled={isBusy}
              icon={<Unlink className='size-4' aria-hidden='true' />}
              onClick={() => disconnect.mutate()}
              variant='ghost'
            >
              Disconnect
            </PanelButton>
          </>
        ) : null}
      </div>

      {connect.isError ||
      deleteEvents.isError ||
      disconnect.isError ||
      sync.isError ? (
        <p className='mt-3 text-xs font-semibold text-accent-rose'>
          Calendar action failed. Check the API log for details.
        </p>
      ) : null}
    </section>
  );
}
