import type { ProjectionExpenseExclusion } from '../../hooks/useProjection';
import { getExclusionLabel } from '../../utils/assumptionDisplay';
import { StatusPill } from './StatusPill';

type ReadOnlyExclusionRowProps = {
  exclusion: ProjectionExpenseExclusion;
};

export function ReadOnlyExclusionRow({
  exclusion,
}: ReadOnlyExclusionRowProps) {
  const label = getExclusionLabel(exclusion);

  return (
    <div className='flex items-center justify-between gap-3 py-2.5'>
      <div className='min-w-0'>
        <p className='truncate text-sm font-semibold text-ink'>{label}</p>
        <p className='mt-0.5 text-xs font-medium text-muted'>
          {exclusion.missing
            ? 'Not found'
            : exclusion.active
              ? 'Excluded from baseline'
              : 'Included in baseline'}
        </p>
      </div>
      <StatusPill
        label={
          exclusion.missing
            ? 'Missing'
            : exclusion.active
              ? 'Excluded'
              : 'Included'
        }
        tone={
          exclusion.missing ? 'amber' : exclusion.active ? 'green' : 'muted'
        }
      />
    </div>
  );
}
