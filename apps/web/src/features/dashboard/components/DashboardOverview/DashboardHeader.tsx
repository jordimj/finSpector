import type { CSSProperties } from 'react';

type DashboardHeaderProps = {
  style?: CSSProperties;
};

export function DashboardHeader({ style }: DashboardHeaderProps) {
  return (
    <div
      className='dashboard-reveal mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'
      style={style}
    >
      <div>
        <h1 className='text-3xl font-semibold tracking-normal text-ink md:text-4xl'>
          Monthly overview
        </h1>
        <div className='mt-3 flex flex-wrap items-center gap-3'>
          <span className='inline-flex h-6 items-center rounded-full bg-accent-green/15 px-3 text-xs font-bold uppercase tracking-[0.14em] text-accent-green'>
            Dashboard
          </span>
          <span className='text-sm font-medium text-muted-strong'>
            Local spend and account activity
          </span>
        </div>
      </div>
    </div>
  );
}
