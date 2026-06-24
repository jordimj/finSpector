import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { PaymentReminder } from '@finance/shared';
import { fetchJson } from '../../lib/api';
import type { PaymentReminderInput } from './types';

export function useUpdatePaymentReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: PaymentReminderInput;
    }) =>
      fetchJson<{ reminder: PaymentReminder }>({
        body: JSON.stringify(input),
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'PATCH',
        path: `/api/payment-reminders/${id}`,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: ['payment-reminders'],
      });
    },
  });
}
