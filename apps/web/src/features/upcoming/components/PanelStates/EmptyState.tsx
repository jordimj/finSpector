import { cn } from '../../../../lib/utils';

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
