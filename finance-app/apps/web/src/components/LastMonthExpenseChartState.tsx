import type { ReactNode } from 'react';

type LastMonthExpenseChartStateProps = {
  children: ReactNode;
};

export function LastMonthExpenseChartState({
  children,
}: LastMonthExpenseChartStateProps) {
  return (
    <div className='flex min-h-[250px] flex-1 items-center justify-center rounded-md bg-canvas/45 px-4 text-center'>
      <div>{children}</div>
    </div>
  );
}
