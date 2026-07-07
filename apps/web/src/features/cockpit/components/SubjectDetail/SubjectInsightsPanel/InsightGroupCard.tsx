import type { CockpitInsightGroup } from '@finance/shared';
import {
  formatInsightMetricValue,
  getInsightMetricToneClass,
} from '../../../utils/insightDisplay';

type InsightGroupCardProps = {
  group: CockpitInsightGroup;
};

export function InsightGroupCard({
  group,
}: InsightGroupCardProps) {
  return (
    <section className='rounded-lg border border-line bg-panel p-5 shadow-shell'>
      <div className='mb-5'>
        <h2 className='text-xl font-semibold tracking-normal text-ink'>
          {group.title}
        </h2>
        <p className='mt-1 text-sm font-medium text-muted'>
          {group.description}
        </p>
      </div>

      <div className='grid gap-3 sm:grid-cols-2'>
        {group.metrics.map((metric) => (
          <div
            key={`${group.title}:${metric.label}`}
            className='rounded-md border border-line bg-canvas/70 p-4'
          >
            <p className='text-xs font-bold uppercase tracking-[0.12em] text-muted'>
              {metric.label}
            </p>
            <p
              className={`mt-3 text-2xl font-bold tabular-nums tracking-normal ${getInsightMetricToneClass(
                metric.tone,
              )}`}
            >
              {formatInsightMetricValue(metric.value)}
            </p>
            <p className='mt-2 text-sm font-medium text-muted-strong'>
              {metric.detail}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
