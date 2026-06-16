import type { ReactNode } from 'react';

type TransactionStateProps = {
  children: ReactNode;
};

export function TransactionState({ children }: TransactionStateProps) {
  return (
    <div className='flex min-h-[240px] items-center justify-center bg-canvas/25 px-5 py-8 text-center'>
      <div>{children}</div>
    </div>
  );
}
