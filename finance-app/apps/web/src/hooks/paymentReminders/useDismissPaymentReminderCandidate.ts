import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchJson } from '../../lib/api';

export function useDismissPaymentReminderCandidate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (key: string) =>
      fetchJson<{ key: string }>({
        body: JSON.stringify({ key }),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
        path: '/api/payment-reminders/candidates/dismiss',
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['payment-reminders'],
      });
    },
  });
}
