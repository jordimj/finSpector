import { useQuery } from '@tanstack/react-query';
import { DEFAULT_PAYMENT_REMINDER_HORIZON_DAYS } from '@finance/shared';
import { fetchJson } from '../../lib/api';
import { appendAccountParam } from '../../utils';
import { useAccountFilter } from '../useAccountFilter';
import type { UpcomingPaymentRemindersResponse } from './types';

export function useUpcomingPaymentReminders(
  days = DEFAULT_PAYMENT_REMINDER_HORIZON_DAYS,
) {
  const { selectedAccount } = useAccountFilter();

  return useQuery({
    queryKey: ['payment-reminders', 'upcoming', selectedAccount, days],
    queryFn: () => {
      const params = new URLSearchParams({
        days: String(days),
      });

      appendAccountParam(params, selectedAccount);

      return fetchJson<UpcomingPaymentRemindersResponse>({
        path: `/api/payment-reminders/upcoming?${params.toString()}`,
      });
    },
  });
}
