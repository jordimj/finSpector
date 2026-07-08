import { Loader2 } from 'lucide-react';
import { cn } from '../../../../lib/utils';

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
