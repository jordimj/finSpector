import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchJson } from '../../lib/api';
import { googleCalendarSyncQueryKey } from './queryKey';
import type { GoogleCalendarDeleteEventsResponse } from './types';

export function useDeleteGoogleCalendarEvents() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      fetchJson<GoogleCalendarDeleteEventsResponse>({
        method: 'DELETE',
        path: '/api/calendar-sync/google/events',
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: googleCalendarSyncQueryKey,
      });
    },
  });
}
