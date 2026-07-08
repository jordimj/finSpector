import { useMutation } from '@tanstack/react-query';
import { fetchJson } from '../../../../lib/api';
import type { GoogleCalendarConnectResponse } from './types';

export function useConnectGoogleCalendar() {
  return useMutation({
    mutationFn: () =>
      fetchJson<GoogleCalendarConnectResponse>({
        method: 'POST',
        path: '/api/calendar-sync/google/connect',
      }),
  });
}
