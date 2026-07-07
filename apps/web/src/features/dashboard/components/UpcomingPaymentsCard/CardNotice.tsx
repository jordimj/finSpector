import { CircleAlert } from 'lucide-react';

type CardNoticeProps = {
  description: string;
  title: string;
};

export function CardNotice({ description, title }: CardNoticeProps) {
  return (
    <div className='rounded-md border border-accent-rose/35 bg-accent-rose/10 p-4'>
      <div className='flex gap-3'>
        <CircleAlert className='mt-0.5 size-5 shrink-0 text-accent-rose' />
        <div>
          <p className='text-sm font-semibold text-ink'>{title}</p>
          <p className='mt-1 text-sm font-medium text-muted-strong'>
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}
