import { useQuery } from '@tanstack/react-query';
import { fetchJson } from '../../lib/api';
import { appendAccountParam } from '../../utils';
import { useAccountFilter } from '../useAccountFilter';
import type { PaymentRemindersResponse } from './types';

export function usePaymentReminders() {
  const { selectedAccount } = useAccountFilter();

  return useQuery({
    queryKey: ['payment-reminders', 'list', selectedAccount],
    queryFn: () => {
      const params = new URLSearchParams();
      appendAccountParam(params, selectedAccount);

      return fetchJson<PaymentRemindersResponse>({
        path: `/api/payment-reminders${
          params.size > 0 ? `?${params.toString()}` : ''
        }`,
      });
    },
  });
}
