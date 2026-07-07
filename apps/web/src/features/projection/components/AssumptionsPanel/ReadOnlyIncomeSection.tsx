import type { ProjectionIncomeSource } from '../../hooks/useProjection';
import { ReadOnlyIncomeRow } from './ReadOnlyIncomeRow';

type ReadOnlyIncomeSectionProps = {
  sources: ProjectionIncomeSource[];
};

export function ReadOnlyIncomeSection({
  sources,
}: ReadOnlyIncomeSectionProps) {
  return (
    <section className='min-w-0'>
      <div className='mb-3 flex items-center justify-between gap-3'>
        <h3 className='text-sm font-semibold uppercase tracking-[0.12em] text-muted-strong'>
          Income sources
        </h3>
        <span className='text-xs font-semibold tabular-nums text-muted'>
          {sources.length} rules
        </span>
      </div>
      <div className='divide-y divide-line rounded-md bg-panel-raised/70 px-3'>
        {sources.map((source) => (
          <ReadOnlyIncomeRow key={source.name} source={source} />
        ))}
      </div>
    </section>
  );
}
