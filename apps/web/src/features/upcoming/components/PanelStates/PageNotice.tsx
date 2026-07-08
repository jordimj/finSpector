import { CircleAlert } from 'lucide-react';

export function PageNotice({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <div className='mb-5 rounded-lg border border-accent-rose/35 bg-accent-rose/10 p-4'>
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
