import type { CockpitInsightTimelineItem } from '@finance/shared';
import { formatCurrency } from '../../../../../utils';
import { formatTimelinePeriod } from '../../../utils/insightDisplay';

type InsightTimelineProps = {
  items: CockpitInsightTimelineItem[];
  title: string;
};

export function InsightTimeline({
  items,
  title,
}: InsightTimelineProps) {
  return (
    <section className='rounded-lg border border-line bg-panel p-5 shadow-shell xl:col-span-2'>
      <div className='mb-5'>
        <h2 className='text-xl font-semibold tracking-normal text-ink'>
          {title}
        </h2>
        <p className='mt-1 text-sm font-medium text-muted'>
          Totals and first/last payment dates by subcategory
        </p>
      </div>

      {items.length === 0 ? (
        <p className='rounded-md bg-canvas/70 px-3 py-3 text-sm font-medium text-muted-strong'>
          No salary payments match the selected period.
        </p>
      ) : (
        <div className='divide-y divide-line overflow-hidden rounded-md border border-line bg-canvas/70'>
          {items.map((item) => (
            <div
              key={item.label}
              className='grid gap-3 px-4 py-4 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center'
            >
              <div className='min-w-0'>
                <p className='truncate text-sm font-semibold text-ink'>
                  {item.label}
                </p>
                <p className='mt-1 text-xs font-medium text-muted'>
                  {formatTimelinePeriod(item)}
                </p>
              </div>
              <span className='inline-flex h-7 items-center justify-center rounded-full bg-accent-cyan/15 px-3 text-xs font-bold uppercase tracking-[0.12em] text-accent-cyan'>
                {item.count} payment{item.count === 1 ? '' : 's'}
              </span>
              <p className='text-left text-sm font-bold tabular-nums text-ink md:text-right'>
                {formatCurrency(Number(item.total))}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
