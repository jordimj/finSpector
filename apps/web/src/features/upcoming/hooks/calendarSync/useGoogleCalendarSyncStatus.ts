import { useQuery } from '@tanstack/react-query';
import { fetchJson } from '../../../../lib/api';
import { googleCalendarSyncQueryKey } from './queryKey';
import type { GoogleCalendarSyncStatus } from './types';

export function useGoogleCalendarSyncStatus() {
  return useQuery({
    queryKey: googleCalendarSyncQueryKey,
    queryFn: () =>
      fetchJson<GoogleCalendarSyncStatus>({
        path: '/api/calendar-sync/google/status',
      }),
  });
}
