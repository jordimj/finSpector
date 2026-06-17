import { createContext, useContext } from 'react';
import type { AccountFilter } from '../types';

type AccountFilterContextValue = {
  selectedAccount: AccountFilter;
  setSelectedAccount: (account: AccountFilter) => void;
};

export const AccountFilterContext =
  createContext<AccountFilterContextValue | null>(null);

export function useAccountFilter(): AccountFilterContextValue {
  const context = useContext(AccountFilterContext);

  if (context === null) {
    throw new Error('useAccountFilter must be used within AppShell');
  }

  return context;
}
