import type { ReactNode } from 'react';

export function PanelButton({
  children,
  disabled,
  icon,
  onClick,
  variant = 'secondary',
}: {
  children: string;
  disabled: boolean;
  icon: ReactNode;
  onClick: () => void;
  variant?: 'danger' | 'ghost' | 'secondary';
}) {
  const className =
    variant === 'danger'
      ? 'inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-accent-rose/35 bg-accent-rose/10 px-3 text-sm font-semibold text-accent-rose transition hover:border-accent-rose/60 hover:bg-accent-rose/15 disabled:cursor-not-allowed disabled:opacity-55'
      : variant === 'ghost'
        ? 'inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-transparent px-3 text-sm font-semibold text-muted-strong transition hover:text-ink disabled:cursor-not-allowed disabled:opacity-55'
        : 'inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-line bg-panel-raised px-3 text-sm font-semibold text-muted-strong transition hover:border-accent-lavender/50 hover:text-ink disabled:cursor-not-allowed disabled:opacity-55';

  return (
    <button
      type='button'
      className={className}
      disabled={disabled}
      onClick={onClick}
    >
      {icon}
      {children}
    </button>
  );
}
