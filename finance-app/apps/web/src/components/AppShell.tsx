import {
  BarChart3,
  Check,
  ChevronDown,
  CircleDollarSign,
  LayoutDashboard,
  Search,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { AccountFilterContext } from '../hooks/useAccountFilter';
import { cn } from '../lib/utils';
import type { AccountFilter } from '../types';

type AppShellProps = {
  children: ReactNode;
};

const navigation = [
  {
    to: '/',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    to: '/analytics',
    label: 'Analytics',
    icon: BarChart3,
  },
] as const;

const accountOptions: Array<{
  value: AccountFilter;
  label: string;
}> = [
  {
    value: null,
    label: 'All accounts',
  },
  {
    value: 'mine',
    label: 'Personal',
  },
  {
    value: 'shared',
    label: 'Shared',
  },
  {
    value: 'kids',
    label: 'Kids',
  },
  {
    value: 'splitwise',
    label: 'Splitwise',
  },
];

export function AppShell({ children }: AppShellProps) {
  const [selectedAccount, setSelectedAccount] = useState<AccountFilter>(null);
  const [isAccountPickerOpen, setIsAccountPickerOpen] = useState(false);
  const accountPickerRef = useRef<HTMLDivElement>(null);
  const selectedAccountOption = accountOptions.find(
    (account) => account.value === selectedAccount,
  );
  const accountFilterContext = useMemo(
    () => ({
      selectedAccount,
      setSelectedAccount,
    }),
    [selectedAccount],
  );
  const accountButtonLabel = selectedAccountOption?.label ?? 'All accounts';

  useEffect(() => {
    if (!isAccountPickerOpen) {
      return undefined;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;

      if (
        target instanceof Node &&
        accountPickerRef.current !== null &&
        !accountPickerRef.current.contains(target)
      ) {
        setIsAccountPickerOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsAccountPickerOpen(false);
      }
    }

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAccountPickerOpen]);

  function handleAccountClick(account: AccountFilter) {
    setSelectedAccount(account);
    setIsAccountPickerOpen(false);
  }

  return (
    <AccountFilterContext.Provider value={accountFilterContext}>
      <div className="min-h-screen bg-canvas text-ink">
        <div className="mx-auto flex min-h-screen w-full max-w-[1440px]">
          <aside className="hidden w-64 shrink-0 border-r border-line bg-panel px-4 py-5 lg:block">
            <div className="mb-8 flex items-center gap-3 px-2">
              <div className="flex size-9 items-center justify-center rounded-lg border border-line bg-panel-raised text-accent-green">
                <CircleDollarSign className="size-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-semibold leading-5">Finance</p>
                <p className="text-xs leading-5 text-muted">Local analytics</p>
              </div>
            </div>

            <nav className="space-y-1" aria-label="Primary navigation">
              {navigation.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    cn(
                      'flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-strong transition hover:bg-panel-raised hover:text-ink',
                      isActive &&
                        'border border-line bg-panel-raised text-ink shadow-shell',
                    )
                  }
                >
                  <item.icon className="size-4" aria-hidden="true" />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </aside>

          <div className="flex min-w-0 flex-1 flex-col">
            <header className="sticky top-0 z-10 border-b border-line bg-canvas/95 px-4 py-3 backdrop-blur md:px-6">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 lg:hidden">
                  <div className="flex size-9 items-center justify-center rounded-lg border border-line bg-panel-raised text-accent-green">
                    <CircleDollarSign className="size-5" aria-hidden="true" />
                  </div>
                  <span className="text-sm font-semibold">Finance</span>
                </div>

                <div className="hidden min-w-0 flex-1 items-center rounded-md border border-line bg-panel px-3 text-muted md:flex">
                  <Search
                    className="mr-2 size-4 shrink-0"
                    aria-hidden="true"
                  />
                  <span className="truncate text-sm">Search transactions</span>
                </div>

                <div
                  ref={accountPickerRef}
                  className="relative flex items-center gap-2"
                >
                  <button
                    type="button"
                    className="inline-flex h-9 max-w-[11rem] items-center gap-2 rounded-md border border-line bg-panel px-3 text-sm font-medium text-muted-strong transition hover:bg-panel-raised hover:text-ink"
                    aria-controls="account-picker"
                    aria-expanded={isAccountPickerOpen}
                    aria-haspopup="menu"
                    onClick={() =>
                      setIsAccountPickerOpen((isOpen) => !isOpen)
                    }
                  >
                    <span className="truncate">{accountButtonLabel}</span>
                    <ChevronDown
                      className={cn(
                        'size-4 shrink-0 transition',
                        isAccountPickerOpen && 'rotate-180',
                      )}
                      aria-hidden="true"
                    />
                  </button>

                  {isAccountPickerOpen && (
                    <div
                      id="account-picker"
                      role="menu"
                      aria-label="Accounts"
                      className="absolute right-0 top-11 z-20 w-52 rounded-lg border border-line bg-panel p-2 shadow-shell"
                    >
                      {accountOptions.map((account) => {
                        const isSelected = account.value === selectedAccount;

                        return (
                          <button
                            key={account.value}
                            type="button"
                            role="menuitemradio"
                            aria-checked={isSelected}
                            className={cn(
                              'flex h-9 w-full items-center justify-between gap-2 rounded-md px-3 text-left text-sm font-medium text-muted-strong transition hover:bg-panel-raised hover:text-ink',
                              isSelected &&
                                'bg-accent-lavender/12 text-accent-lavender',
                            )}
                            onClick={() => handleAccountClick(account.value)}
                          >
                            <span className="truncate">{account.label}</span>
                            <Check
                              className={cn(
                                'size-4 shrink-0 transition',
                                isSelected ? 'opacity-100' : 'opacity-0',
                              )}
                              aria-hidden="true"
                            />
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <nav
                className="mt-3 flex gap-2 overflow-x-auto lg:hidden"
                aria-label="Primary navigation"
              >
                {navigation.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      cn(
                        'flex h-9 shrink-0 items-center gap-2 rounded-md border border-transparent px-3 text-sm font-medium text-muted-strong',
                        isActive && 'border-line bg-panel-raised text-ink',
                      )
                    }
                  >
                    <item.icon className="size-4" aria-hidden="true" />
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            </header>

            <main className="flex-1 px-4 py-6 md:px-6 lg:px-8">
              {children}
            </main>
          </div>
        </div>
      </div>
    </AccountFilterContext.Provider>
  );
}
