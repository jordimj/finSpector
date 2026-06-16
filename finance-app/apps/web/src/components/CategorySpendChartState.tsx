import type { ReactNode } from 'react';

type CategorySpendChartStateProps = {
  children: ReactNode;
};

export function CategorySpendChartState({
  children,
}: CategorySpendChartStateProps) {
  return (
    <div className='flex aspect-square min-h-[300px] flex-1 items-center justify-center rounded-md border border-line/70 bg-canvas/70 px-4 text-center'>
      <div>{children}</div>
    </div>
  );
}
