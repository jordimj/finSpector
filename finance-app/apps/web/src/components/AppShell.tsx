import {
  BarChart3,
  CircleDollarSign,
  LayoutDashboard,
  Search,
} from 'lucide-react';
import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '../lib/utils';

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

export function AppShell({ children }: AppShellProps) {
  return (
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
                <Search className="mr-2 size-4 shrink-0" aria-hidden="true" />
                <span className="truncate text-sm">Search transactions</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="h-9 rounded-md border border-line bg-panel px-3 text-sm font-medium text-muted-strong transition hover:bg-panel-raised hover:text-ink"
                >
                  All accounts
                </button>
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

          <main className="flex-1 px-4 py-6 md:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
