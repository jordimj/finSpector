import { cn } from '../../../../lib/utils';

type ComparisonToggleProps = {
  isComparisonActive: boolean;
  isComparisonAvailable: boolean;
  onComparisonEnabledChange: (isEnabled: boolean) => void;
};

export function ComparisonToggle({
  isComparisonActive,
  isComparisonAvailable,
  onComparisonEnabledChange,
}: ComparisonToggleProps) {
  return (
    <label
      className={cn(
        'inline-flex h-10 items-center gap-2 text-sm font-semibold transition',
        isComparisonAvailable
          ? 'cursor-pointer text-muted-strong hover:text-ink'
          : 'cursor-not-allowed text-muted opacity-50',
        isComparisonActive && 'text-accent-cyan hover:text-accent-cyan',
      )}
    >
      <input
        type='checkbox'
        className='peer sr-only'
        checked={isComparisonActive}
        disabled={!isComparisonAvailable}
        onChange={(event) =>
          onComparisonEnabledChange(event.currentTarget.checked)
        }
      />
      <span
        className={cn(
          'relative h-5 w-9 rounded-full bg-canvas ring-1 ring-line transition peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent-lavender',
          isComparisonActive
            ? 'bg-accent-cyan/25 ring-accent-cyan/60'
            : 'bg-canvas',
        )}
        aria-hidden='true'
      >
        <span
          className={cn(
            'absolute left-0.5 top-0.5 size-4 rounded-full bg-muted-strong transition',
            isComparisonActive && 'translate-x-4 bg-accent-cyan',
          )}
        />
      </span>
      <span className='whitespace-nowrap'>Compare previous</span>
    </label>
  );
}
