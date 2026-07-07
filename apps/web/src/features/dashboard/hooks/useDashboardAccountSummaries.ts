import {
  getPersonalTransactionAmount,
  type ExpenseAccount,
  type Transaction,
} from '@finance/shared';
import { formatSignedTransactionCurrency } from '../utils/formatSignedTransactionCurrency';
import { useRecentTransactions } from './useRecentTransactions';

export type DashboardAccountSummary = {
  account: Extract<ExpenseAccount, 'mine' | 'shared' | 'kids'>;
  badge: string;
  detail: string;
  footer: string;
  label: string;
  tone: 'green' | 'lavender' | 'rose';
  value: string;
};

const accountConfigs = [
  {
    account: 'mine',
    badge: 'Personal',
    label: 'Personal Account',
    tone: 'green',
  },
  {
    account: 'shared',
    badge: 'Shared',
    label: 'Shared Savings',
    tone: 'lavender',
  },
  {
    account: 'kids',
    badge: 'Kids',
    label: 'Kids Fund',
    tone: 'rose',
  },
] satisfies Array<
  Pick<DashboardAccountSummary, 'account' | 'badge' | 'label' | 'tone'>
>;

export function useDashboardAccountSummaries() {
  const recentTransactions = useRecentTransactions();

  return buildAccountSummaries(
    recentTransactions.data?.transactions ?? [],
    recentTransactions.isLoading,
    recentTransactions.isError,
  );
}

function buildAccountSummaries(
  transactions: Transaction[],
  isLoading: boolean,
  isError: boolean,
): DashboardAccountSummary[] {
  return accountConfigs.map((config) => {
    const accountTransactions = transactions.filter(
      (transaction) => transaction.account === config.account,
    );
    const recentNet = accountTransactions.reduce((sum, transaction) => {
      const amount = getPersonalTransactionAmount(
        Number(transaction.amount),
        transaction.account,
      );

      return transaction.type === 'income' ? sum + amount : sum - amount;
    }, 0);
    const hasActivity = accountTransactions.length > 0;

    return {
      account: config.account,
      badge: config.badge,
      detail: isError
        ? 'Activity unavailable'
        : hasActivity
          ? `${accountTransactions.length} recent transactions`
          : 'No recent activity',
      footer: isError ? 'API offline' : 'Recent net',
      label: config.label,
      tone: config.tone,
      value: isLoading
        ? '...'
        : hasActivity
          ? formatSignedTransactionCurrency(recentNet)
          : '--',
    };
  });
}
