import type { CSSProperties } from 'react';
import { cn } from '../../../../lib/utils';

type HeaderProps = {
  className?: string;
  historyLabel: string;
  periodLabel: string;
  style?: CSSProperties;
};

export function Header({
  className,
  historyLabel,
  periodLabel,
  style,
}: HeaderProps) {
  return (
    <div
      className={cn(
        'mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
      style={style}
    >
      <div>
        <h1 className='text-3xl font-semibold tracking-normal text-ink md:text-4xl'>
          12-month projection
        </h1>
        <div className='mt-3 flex flex-wrap items-center gap-3'>
          <span className='inline-flex h-6 items-center rounded-full bg-accent-cyan/15 px-3 text-xs font-bold uppercase tracking-[0.14em] text-accent-cyan'>
            Projection
          </span>
          <span className='text-sm font-medium text-muted-strong'>
            {periodLabel} from {historyLabel}
          </span>
        </div>
      </div>
    </div>
  );
}
