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
  variant?: 'ghost' | 'secondary';
}) {
  return (
    <button
      type='button'
      className={
        variant === 'ghost'
          ? 'inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-transparent px-3 text-sm font-semibold text-muted-strong transition hover:text-ink disabled:cursor-not-allowed disabled:opacity-55'
          : 'inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-line bg-panel-raised px-3 text-sm font-semibold text-muted-strong transition hover:border-accent-lavender/50 hover:text-ink disabled:cursor-not-allowed disabled:opacity-55'
      }
      disabled={disabled}
      onClick={onClick}
    >
      {icon}
      {children}
    </button>
  );
}
