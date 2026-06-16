import type { ReactNode } from 'react';

type IncomeVsExpensesChartStateProps = {
  children: ReactNode;
};

export function IncomeVsExpensesChartState({
  children,
}: IncomeVsExpensesChartStateProps) {
  return (
    <div className='flex min-h-[330px] flex-1 items-center justify-center rounded-md border border-line/70 bg-canvas/70 px-4 text-center'>
      <div>{children}</div>
    </div>
  );
}
