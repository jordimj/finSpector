import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchJson } from '../../../../lib/api';
import { googleCalendarSyncQueryKey } from './queryKey';
import type { GoogleCalendarSyncResponse } from './types';

export function useSyncGoogleCalendar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      fetchJson<GoogleCalendarSyncResponse>({
        method: 'POST',
        path: '/api/calendar-sync/google/sync',
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: googleCalendarSyncQueryKey,
      });
    },
  });
}
