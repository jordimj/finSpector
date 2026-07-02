import { useQuery } from '@tanstack/react-query';
import { fetchJson } from '../../lib/api';
import { appendAccountParam } from '../../utils';
import { useAccountFilter } from '../useAccountFilter';
import type { PaymentReminderCandidatesResponse } from './types';

export function usePaymentReminderCandidates() {
  const { selectedAccount } = useAccountFilter();

  return useQuery({
    queryKey: ['payment-reminders', 'candidates', selectedAccount],
    queryFn: () => {
      const params = new URLSearchParams();
      appendAccountParam(params, selectedAccount);

      return fetchJson<PaymentReminderCandidatesResponse>({
        path: `/api/payment-reminders/candidates${
          params.size > 0 ? `?${params.toString()}` : ''
        }`,
      });
    },
  });
}
