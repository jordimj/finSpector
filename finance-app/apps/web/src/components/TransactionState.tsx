import type { ReactNode } from 'react';

type TransactionStateProps = {
  children: ReactNode;
};

export function TransactionState({ children }: TransactionStateProps) {
  return (
    <div className='flex min-h-[180px] items-center justify-center px-5 py-8 text-center'>
      <div>{children}</div>
    </div>
  );
}
