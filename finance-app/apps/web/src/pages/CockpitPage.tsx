import {
  ArrowUpRight,
  Banknote,
  Building2,
  CalendarClock,
  Car,
  CircleParking,
  Home,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { CockpitSubjectSlug, CockpitSubjectSummary } from '@finance/shared';
import {
  DateRangePicker,
  type DateRangePresetKey,
} from '../components/DateRangePicker';
import { useCockpitSubjects } from '../hooks/useCockpitSubjects';
import type { ReportDateRange } from '../types';
import {
  formatCurrency,
  formatReportDateRange,
  formatTransactionDate,
  getCurrentYearRange,
} from '../utils';

const subjectIcons = {
  car: Car,
  flat: Building2,
  home: Home,
  parking: CircleParking,
  salaries: Banknote,
} satisfies Record<CockpitSubjectSlug, LucideIcon>;

const cockpitSections = [
  {
    title: 'Grouped expenses',
    slugs: ['home', 'car'],
  },
  {
    title: 'Salaries',
    slugs: ['salaries'],
  },
  {
    title: 'Properties',
    slugs: ['flat', 'parking'],
  },
] satisfies Array<{
  title: string;
  slugs: CockpitSubjectSlug[];
}>;

export function CockpitPage() {
  const [dateRange, setDateRange] = useState<ReportDateRange>(() =>
    getCurrentYearRange(),
  );
  const [selectedPresetKey, setSelectedPresetKey] =
    useState<DateRangePresetKey | null>('this-year');
  const subjects = useCockpitSubjects(dateRange);
  const periodLabel = formatReportDateRange(dateRange, { includeYear: true });
  const subjectsBySlug = new Map(
    (subjects.data ?? []).map((subject) => [subject.slug, subject]),
  );

  return (
    <section className='mx-auto max-w-[1600px]'>
      <div className='mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <h1 className='text-3xl font-semibold tracking-normal text-ink md:text-4xl'>
            Cockpit
          </h1>
          <div className='mt-3 flex flex-wrap items-center gap-3'>
            <span className='inline-flex h-6 items-center rounded-full bg-accent-cyan/15 px-3 text-xs font-bold uppercase tracking-[0.14em] text-accent-cyan'>
              Subject view
            </span>
            <span className='text-sm font-medium text-muted-strong'>
              Period: {periodLabel}
            </span>
          </div>
        </div>

        <DateRangePicker
          dateRange={dateRange}
          id='cockpit'
          selectedPresetKey={selectedPresetKey}
          onChange={(nextDateRange, nextPresetKey) => {
            setDateRange(nextDateRange);
            setSelectedPresetKey(nextPresetKey);
          }}
        />
      </div>

      {subjects.isError ? (
        <CockpitNotice
          description='Check that the API is running and the cockpit routes are available.'
          title='Cockpit subjects unavailable'
        />
      ) : null}

      <div className='space-y-9'>
        {cockpitSections.map((section) => (
          <CockpitSubjectSection
            key={section.title}
            isLoading={subjects.isLoading && subjects.data === undefined}
            section={section}
            subjects={section.slugs
              .map((slug) => subjectsBySlug.get(slug))
              .filter(isSubjectSummary)}
          />
        ))}
      </div>
    </section>
  );
}

function CockpitSubjectSection({
  isLoading,
  section,
  subjects,
}: {
  isLoading: boolean;
  section: (typeof cockpitSections)[number];
  subjects: CockpitSubjectSummary[];
}) {
  if (!isLoading && subjects.length === 0) {
    return null;
  }

  return (
    <section>
      <div className='mb-4 border-b border-line pb-3'>
        <h2 className='text-lg font-semibold tracking-normal text-ink'>
          {section.title}
        </h2>
      </div>

      <div className='grid gap-5 md:grid-cols-2 xl:grid-cols-3'>
        {isLoading
          ? section.slugs.map((slug) => <CockpitSubjectCardSkeleton key={slug} />)
          : subjects.map((subject) => (
              <CockpitSubjectCard key={subject.slug} subject={subject} />
            ))}
      </div>
    </section>
  );
}

function CockpitSubjectCard({ subject }: { subject: CockpitSubjectSummary }) {
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

type SubjectMetricModel = {
  label: string;
  tone: 'green' | 'ink' | 'lavender' | 'rose';
  value: string;
};

function getSubjectCardMetrics(
  subject: CockpitSubjectSummary,
): SubjectMetricModel[] {
  if (isExpenseOnlySubject(subject.slug)) {
    return [
      {
        label: 'Expenses',
        tone: 'lavender',
        value: subject.totals.expenses,
      },
    ];
  }

  if (subject.slug === 'salaries') {
    return [
      {
        label: 'Income',
        tone: 'green',
        value: subject.totals.income,
      },
    ];
  }

  const net = Number(subject.totals.net);

  return [
    {
      label: 'Expenses',
      tone: 'lavender',
      value: subject.totals.expenses,
    },
    {
      label: 'Income',
      tone: 'green',
      value: subject.totals.income,
    },
    {
      label: 'Net',
      tone: net >= 0 ? 'green' : 'rose',
      value: subject.totals.net,
    },
  ];
}

function SubjectPrimaryMetric({ metric }: { metric: SubjectMetricModel }) {
  return (
    <div className='min-w-0'>
      <p className='text-xs font-bold uppercase tracking-[0.12em] text-muted'>
        {metric.label}
      </p>
      <p
        className={`mt-2 truncate text-2xl font-bold tabular-nums tracking-normal ${getMetricToneClass(
          metric.tone,
        )}`}
      >
        {formatCurrency(Number(metric.value))}
      </p>
    </div>
  );
}

function SubjectSecondaryMetric({ metric }: { metric: SubjectMetricModel }) {
  return (
    <div className='min-w-0'>
      <p className='truncate text-[0.7rem] font-bold uppercase tracking-[0.12em] text-muted'>
        {metric.label}
      </p>
      <p
        className={`mt-1 truncate text-sm font-bold tabular-nums ${getMetricToneClass(
          metric.tone,
        )}`}
      >
        {formatCurrency(Number(metric.value))}
      </p>
    </div>
  );
}

function getMetricToneClass(tone: SubjectMetricModel['tone']): string {
  const toneClass = {
    green: 'text-accent-green',
    ink: 'text-ink',
    lavender: 'text-accent-lavender',
    rose: 'text-accent-rose',
  } satisfies Record<SubjectMetricModel['tone'], string>;

  return toneClass[tone];
}

function isSubjectSummary(
  subject: CockpitSubjectSummary | undefined,
): subject is CockpitSubjectSummary {
  return subject !== undefined;
}

function isExpenseOnlySubject(slug: CockpitSubjectSlug): boolean {
  return slug === 'home' || slug === 'car';
}

function CockpitSubjectCardSkeleton() {
  return (
    <div className='min-h-[20rem] rounded-lg border border-line bg-panel p-5 shadow-shell'>
      <div className='mb-8 flex items-start justify-between'>
        <div className='size-12 animate-pulse rounded-full bg-muted/15' />
        <div className='h-7 w-20 animate-pulse rounded-full bg-muted/15' />
      </div>
      <div className='h-6 w-28 animate-pulse rounded-full bg-muted/25' />
      <div className='mt-4 h-4 w-4/5 animate-pulse rounded-full bg-muted/15' />
      <div className='mt-2 h-4 w-3/5 animate-pulse rounded-full bg-muted/15' />
      <div className='mt-8 h-24 animate-pulse rounded-md bg-muted/10' />
      <div className='mt-6 h-20 animate-pulse rounded-md bg-muted/10' />
      <div className='mt-4 flex justify-end border-t border-line pt-4'>
        <div className='size-9 animate-pulse rounded-full bg-muted/10' />
      </div>
    </div>
  );
}

function CockpitNotice({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <div className='mb-5 rounded-lg border border-accent-rose/35 bg-accent-rose/10 px-4 py-3'>
      <p className='text-sm font-semibold text-accent-rose'>{title}</p>
      <p className='mt-1 text-sm font-medium text-muted-strong'>
        {description}
      </p>
    </div>
  );
}
