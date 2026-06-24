import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchJson } from '../../lib/api';

export function useDeactivatePaymentReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      fetchJson<{ active: boolean; id: string }>({
        method: 'DELETE',
        path: `/api/payment-reminders/${id}`,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['payment-reminders'],
      });
    },
  });
}
