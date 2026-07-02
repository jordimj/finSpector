import { CircleAlert, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

export function LoadingState({
  compact = false,
  label,
}: {
  compact?: boolean;
  label: string;
}) {
  return (
    <div
      className={cn(
        'flex items-center justify-center text-sm font-medium text-muted',
        compact ? 'min-h-20' : 'min-h-80',
      )}
    >
      <Loader2 className='mr-2 size-4 animate-spin' aria-hidden='true' />
      {label}
    </div>
  );
}

export function EmptyState({
  compact = false,
  description,
  title,
}: {
  compact?: boolean;
  description: string;
  title: string;
}) {
  return (
    <div
      className={cn(
        'mx-5 my-5 rounded-md border border-line bg-canvas/70 p-4',
        compact && 'mx-0',
      )}
    >
      <p className='text-sm font-semibold text-ink'>{title}</p>
      <p className='mt-1 text-sm font-medium text-muted'>{description}</p>
    </div>
  );
}

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
