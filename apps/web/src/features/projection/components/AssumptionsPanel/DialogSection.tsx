import type { ReactNode } from 'react';

type DialogSectionProps = {
  children: ReactNode;
  description: string;
  title: string;
};

export function DialogSection({
  children,
  description,
  title,
}: DialogSectionProps) {
  return (
    <section className='rounded-md border border-line bg-panel-raised/70 p-4'>
      <h3 className='text-sm font-semibold uppercase tracking-[0.12em] text-muted-strong'>
        {title}
      </h3>
      <p className='mt-1 text-sm font-medium text-muted'>{description}</p>
      <div className='mt-4'>{children}</div>
    </section>
  );
}
