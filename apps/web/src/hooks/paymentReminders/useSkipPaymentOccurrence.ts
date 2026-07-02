import { useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchJson } from '../../lib/api';
import type { PaymentOccurrenceMutationInput } from './types';

export function useSkipPaymentOccurrence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      dueDate,
      reminderId,
    }: PaymentOccurrenceMutationInput) =>
      fetchJson({
        method: 'POST',
        path: `/api/payment-reminders/${reminderId}/occurrences/${dueDate}/skip`,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['payment-reminders'],
      });
    },
  });
}
