import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { PaymentReminder } from '@finance/shared';
import { fetchJson } from '../../lib/api';
import type { PaymentReminderInput } from './types';

export function useCreatePaymentReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: PaymentReminderInput) =>
      fetchJson<{ reminder: PaymentReminder }>({
        body: JSON.stringify(input),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
        path: '/api/payment-reminders',
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['payment-reminders'],
      });
    },
  });
}
