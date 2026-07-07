import { cn } from '../../../../lib/utils';

type StatusPillProps = {
  label: string;
  tone: 'amber' | 'green' | 'muted';
};

export function StatusPill({ label, tone }: StatusPillProps) {
  const toneClass = {
    amber: 'bg-accent-amber/15 text-accent-amber',
    green: 'bg-accent-green/15 text-accent-green',
    muted: 'bg-muted/15 text-muted',
  }[tone];

  return (
    <span
      className={cn(
        'shrink-0 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-[0.12em]',
        toneClass,
      )}
    >
      {label}
    </span>
  );
}
