import { ArrowUpRight, CalendarClock } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { CockpitSubjectSummary } from '@finance/shared';
import { formatCurrency, formatTransactionDate } from '../../../../../utils';
import { getSubjectCardMetrics } from '../../../utils/subjectMetrics';
import { subjectIcons } from '../../../utils/subjectIcons';
import { SubjectPrimaryMetric } from './SubjectPrimaryMetric';
import { SubjectSecondaryMetric } from './SubjectSecondaryMetric';

type SubjectCardProps = {
  subject: CockpitSubjectSummary;
};

export function SubjectCard({ subject }: SubjectCardProps) {
  const Icon = subjectIcons[subject.slug];
  const metrics = getSubjectCardMetrics(subject);
  const primaryMetric = metrics[0];
  const secondaryMetrics = metrics.slice(1);
  const nextOccurrence = subject.upcoming.nextOccurrence;

  return (
    <Link
      to={`/cockpit/${subject.slug}`}
      className='group flex min-h-[20rem] flex-col rounded-lg border border-line bg-panel p-5 shadow-shell transition hover:border-accent-lavender/45 hover:bg-panel-raised/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-lavender'
    >
      <div className='mb-6 flex items-start justify-between gap-4'>
        <span className='flex size-12 items-center justify-center rounded-full bg-accent-lavender/15 text-accent-lavender'>
          <Icon className='size-5' aria-hidden='true' />
        </span>
        <span className='inline-flex h-7 items-center rounded-full bg-canvas px-3 text-xs font-bold uppercase tracking-[0.12em] text-muted-strong'>
          {subject.transactionCount} rows
        </span>
      </div>

      <div>
        <h2 className='text-xl font-semibold tracking-normal text-ink'>
          {subject.name}
        </h2>
        <p className='mt-2 min-h-10 text-sm font-medium text-muted'>
          {subject.description}
        </p>
      </div>

      <div className='mt-6 rounded-md border border-line bg-canvas/65 p-4'>
        {primaryMetric !== undefined ? (
          <SubjectPrimaryMetric metric={primaryMetric} />
        ) : null}
        {secondaryMetrics.length > 0 ? (
          <div className='mt-4 grid grid-cols-2 gap-3 border-t border-line pt-3'>
            {secondaryMetrics.map((metric) => (
              <SubjectSecondaryMetric key={metric.label} metric={metric} />
            ))}
          </div>
        ) : null}
      </div>

      <div className='mt-6 rounded-md border border-line bg-canvas/70 p-4'>
        <div className='flex items-center justify-between gap-3'>
          <span className='inline-flex items-center gap-2 text-sm font-semibold text-muted-strong'>
            <CalendarClock className='size-4' aria-hidden='true' />
            Upcoming
          </span>
          <span className='text-sm font-bold tabular-nums text-ink'>
            {formatCurrency(Number(subject.upcoming.total))}
          </span>
        </div>
        <p className='mt-2 truncate text-sm font-medium text-muted'>
          {nextOccurrence === null
            ? 'No scoped reminders'
            : `${nextOccurrence.reminderName} · ${formatTransactionDate(
                nextOccurrence.dueDate,
              )}`}
        </p>
      </div>

      <div className='mt-auto flex justify-end border-t border-line pt-4'>
        <span className='sr-only'>Open {subject.name}</span>
        <span className='flex size-9 items-center justify-center rounded-full border border-line bg-canvas text-muted-strong transition group-hover:border-accent-lavender/60 group-hover:text-accent-lavender'>
          <ArrowUpRight
            className='size-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5'
            aria-hidden='true'
          />
        </span>
      </div>
    </Link>
  );
}
