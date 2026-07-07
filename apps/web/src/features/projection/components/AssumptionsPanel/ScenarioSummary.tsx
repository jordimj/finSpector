import { cn } from '../../../../lib/utils';
import { formatSignedCurrency } from '../../../../utils';
import type { ProjectionSettings } from '../../hooks/useProjectionSettings';

type ScenarioSummaryProps = {
  scenarioDelta: number;
  settings: ProjectionSettings;
};

export function ScenarioSummary({
  scenarioDelta,
  settings,
}: ScenarioSummaryProps) {
  return (
    <div className='rounded-md border border-accent-cyan/30 bg-accent-cyan/10 px-4 py-3 lg:col-span-2'>
      <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <p className='text-sm font-semibold text-ink'>
            One-off events active
          </p>
          <p className='mt-1 text-xs font-medium text-muted-strong'>
            {settings.oneOffEvents.length} one-off event
            {settings.oneOffEvents.length === 1 ? '' : 's'}
          </p>
        </div>
        <span
          className={cn(
            'text-sm font-bold tabular-nums',
            scenarioDelta >= 0 ? 'text-accent-green' : 'text-accent-rose',
          )}
        >
          {formatSignedCurrency(scenarioDelta)}
        </span>
      </div>
    </div>
  );
}
