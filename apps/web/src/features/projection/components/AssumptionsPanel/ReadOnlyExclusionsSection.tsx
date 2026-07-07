import type { ProjectionExpenseExclusion } from '../../hooks/useProjection';
import { ReadOnlyExclusionRow } from './ReadOnlyExclusionRow';

type ReadOnlyExclusionsSectionProps = {
  exclusions: ProjectionExpenseExclusion[];
};

export function ReadOnlyExclusionsSection({
  exclusions,
}: ReadOnlyExclusionsSectionProps) {
  return (
    <section className='min-w-0'>
      <div className='mb-3 flex items-center justify-between gap-3'>
        <h3 className='text-sm font-semibold uppercase tracking-[0.12em] text-muted-strong'>
          Expense exclusions
        </h3>
        <span className='text-xs font-semibold tabular-nums text-muted'>
          {exclusions.filter((exclusion) => exclusion.active).length} active
        </span>
      </div>
      <div className='divide-y divide-line rounded-md bg-panel-raised/70 px-3'>
        {exclusions.map((exclusion) => (
          <ReadOnlyExclusionRow key={exclusion.key} exclusion={exclusion} />
        ))}
      </div>
    </section>
  );
}
