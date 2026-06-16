import type { ReactNode } from 'react';

type IncomeVsExpensesChartStateProps = {
  children: ReactNode;
};

export function IncomeVsExpensesChartState({
  children,
}: IncomeVsExpensesChartStateProps) {
  return (
    <div className='flex min-h-[280px] flex-1 items-center justify-center rounded-md border border-line bg-canvas px-4 text-center'>
      <div>{children}</div>
    </div>
  );
}
