import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchJson } from '../../lib/api';
import { googleCalendarSyncQueryKey } from './queryKey';

export function useDisconnectGoogleCalendar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      fetchJson<{ state: 'notConnected' }>({
        method: 'POST',
        path: '/api/calendar-sync/google/disconnect',
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: googleCalendarSyncQueryKey,
      });
    },
  });
}
