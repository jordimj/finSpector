import { ArrowRight } from 'lucide-react';
import type { ReactNode } from 'react';

type SummaryTileProps = {
  badge: string;
  detail: string;
  footer: string;
  label: string;
  tone: 'green' | 'lavender' | 'rose';
  value: string;
  icon: ReactNode;
};

const toneStyles = {
  green: {
    badge: 'bg-accent-green/15 text-accent-green',
    icon: 'bg-accent-green/15 text-accent-green',
  },
  lavender: {
    badge: 'bg-accent-lavender/15 text-accent-lavender',
    icon: 'bg-accent-lavender/15 text-accent-lavender',
  },
  rose: {
    badge: 'bg-accent-rose/15 text-accent-rose',
    icon: 'bg-accent-rose/15 text-accent-rose',
  },
} satisfies Record<
  SummaryTileProps['tone'],
  {
    badge: string;
    icon: string;
  }
>;

export function SummaryTile({
  badge,
  detail,
  footer,
  icon,
  label,
  tone,
  value,
}: SummaryTileProps) {
  const styles = toneStyles[tone];

  return (
    <div className='rounded-lg border border-line bg-panel p-5 shadow-shell transition hover:border-accent-lavender/40 hover:bg-panel-raised/35'>
      <div className='mb-9 flex items-start justify-between gap-4'>
        <span
          className={[
            'flex size-12 items-center justify-center rounded-full',
            styles.icon,
          ].join(' ')}
        >
          {icon}
        </span>
        <span
          className={[
            'rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.12em]',
            styles.badge,
          ].join(' ')}
        >
          {badge}
        </span>
      </div>

      <p className='text-sm font-semibold uppercase tracking-[0.12em] text-muted-strong'>
        {label}
      </p>
      <p className='mt-3 text-2xl font-bold tabular-nums tracking-normal text-ink'>
        {value}
      </p>
      <p className='mt-2 text-sm font-medium text-muted'>{detail}</p>

      <div className='mt-8 flex items-center justify-between border-t border-line pt-4'>
        <span className='text-xs font-medium text-muted-strong'>{footer}</span>
        <ArrowRight className='size-5 text-muted-strong' aria-hidden='true' />
      </div>
    </div>
  );
}
