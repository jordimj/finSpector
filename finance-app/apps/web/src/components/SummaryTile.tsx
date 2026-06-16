import { ReactNode } from 'react';

type SummaryTileProps = {
  label: string;
  value: string;
  icon: ReactNode;
};

export function SummaryTile({ label, value, icon }: SummaryTileProps) {
  return (
    <div className='rounded-lg border border-line bg-panel p-4'>
      <div className='mb-4 flex items-center justify-between'>
        <span className='text-sm font-medium text-muted'>{label}</span>
        <span className='flex size-8 items-center justify-center rounded-md border border-line bg-panel-raised text-accent-green'>
          {icon}
        </span>
      </div>
      <p className='text-2xl font-semibold text-ink'>{value}</p>
    </div>
  );
}
