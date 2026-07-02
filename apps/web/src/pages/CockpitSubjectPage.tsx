import {
  Banknote,
  CalendarClock,
  ChevronLeft,
  CircleAlert,
  ReceiptText,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  COCKPIT_SUBJECT_SLUGS,
  type CockpitBreakdownItem,
  type CockpitCashflowPeriod,
  type CockpitInsightGroup,
  type CockpitInsightMetricTone,
  type CockpitInsightTimelineItem,
  type CockpitSubjectDetail,
  type CockpitSubjectSlug,
  type PaymentOccurrenceState,
  type PaymentReminderOccurrence,
  type TransactionType,
} from '@finance/shared';
import { CategoriesCard } from '../components/CategoriesCard';
import { CategorySpendChart } from '../components/CategorySpendChart';
import {
  DateRangePicker,
  type DateRangePresetKey,
} from '../components/DateRangePicker';
import { IncomeVsExpensesCard } from '../components/IncomeVsExpensesCard';
import { SummaryTile } from '../components/SummaryTile';
import { TransactionTableHeader } from '../components/TransactionTableHeader';
import { TransactionsTableContent } from '../components/TransactionsTableContent';
import {
  useCockpitSubject,
} from '../hooks/useCockpitSubjects';
import type { CategorySpend } from '../hooks/useCategorySpend';
import type { IncomeVsExpenses } from '../hooks/useIncomeVsExpenses';
import type { ReportDateRange } from '../types';
import {
  formatCurrency,
  formatDateRange,
  formatReportDateRange,
  formatTransactionDate,
  getCurrentYearRange,
} from '../utils';

export function CockpitSubjectPage() {
  const { subjectSlug } = useParams();
  const slug = isCockpitSubjectSlug(subjectSlug) ? subjectSlug : undefined;
  const [dateRange, setDateRange] = useState<ReportDateRange>(() =>
    getCurrentYearRange(),
  );
  const [selectedPresetKey, setSelectedPresetKey] =
    useState<DateRangePresetKey | null>('this-year');
  const subjectQuery = useCockpitSubject(slug, dateRange);
  const subject = subjectQuery.data;
  const periodLabel = formatReportDateRange(dateRange, { includeYear: true });
  const cashflow = useMemo(
    () =>
      subject === undefined
        ? undefined
        : toIncomeVsExpenses(subject, dateRange),
    [dateRange, subject],
  );
  const expenseBreakdown = useMemo(
    () => toCategorySpend(subject?.breakdown ?? [], 'expense'),
    [subject?.breakdown],
  );
  const incomeBreakdown = useMemo(
    () => toCategorySpend(subject?.breakdown ?? [], 'income'),
    [subject?.breakdown],
  );
  const expenseSubcategoryBreakdown = useMemo(
    () => toSubcategorySpend(subject?.breakdown ?? [], 'expense'),
    [subject?.breakdown],
  );

  if (slug === undefined) {
    return (
      <section className='mx-auto max-w-[1600px]'>
        <Link
          to='/cockpit'
          className='mb-5 inline-flex h-9 items-center gap-2 rounded-md border border-line bg-panel px-3 text-sm font-semibold text-muted-strong transition hover:bg-panel-raised hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-lavender'
        >
          <ChevronLeft className='size-4' aria-hidden='true' />
          Cockpit
        </Link>
        <CockpitSubjectNotice
          description='This cockpit subject is not configured.'
          title='Subject not found'
        />
      </section>
    );
  }

  const usesExpenseOnlyLayout = isExpenseOnlySubject(slug);
  const usesIncomeOnlyLayout = isIncomeOnlySubject(slug);

  return (
    <section className='mx-auto max-w-[1600px]'>
      <div className='mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <Link
            to='/cockpit'
            className='mb-3 inline-flex h-9 items-center gap-2 rounded-md border border-line bg-panel px-3 text-sm font-semibold text-muted-strong transition hover:bg-panel-raised hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-lavender'
          >
            <ChevronLeft className='size-4' aria-hidden='true' />
            Cockpit
          </Link>
          <h1 className='text-3xl font-semibold tracking-normal text-ink md:text-4xl'>
            {subject?.name ?? 'Cockpit subject'}
          </h1>
          <div className='mt-3 flex flex-wrap items-center gap-3'>
            <span className='inline-flex h-6 items-center rounded-full bg-accent-cyan/15 px-3 text-xs font-bold uppercase tracking-[0.14em] text-accent-cyan'>
              Cockpit
            </span>
            <span className='text-sm font-medium text-muted-strong'>
              Period: {periodLabel}
            </span>
            {subject?.description !== undefined ? (
              <span className='text-sm font-medium text-muted'>
                {subject.description}
              </span>
            ) : null}
          </div>
        </div>

        <DateRangePicker
          dateRange={dateRange}
          id={`cockpit-${slug}`}
          selectedPresetKey={selectedPresetKey}
          onChange={(nextDateRange, nextPresetKey) => {
            setDateRange(nextDateRange);
            setSelectedPresetKey(nextPresetKey);
          }}
        />
      </div>

      {subjectQuery.isError ? (
        <CockpitSubjectNotice
          description='Check that the API is running and this subject can be loaded.'
          title='Subject unavailable'
        />
      ) : null}

      <CockpitSubjectSummaryTiles
        isLoading={subjectQuery.isLoading}
        slug={slug}
        subject={subject}
      />

      <CockpitSubjectInsightsPanel subject={subject} />

      {usesExpenseOnlyLayout ? (
        <>
          <div className='mt-8 grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]'>
            <CockpitExpensePieCard
              categories={expenseSubcategoryBreakdown.items}
              isError={subjectQuery.isError}
              isLoading={subjectQuery.isLoading}
              periodLabel={periodLabel}
              total={expenseSubcategoryBreakdown.total}
            />

            <CockpitUpcomingPanel
              isError={subjectQuery.isError}
              isLoading={subjectQuery.isLoading}
              occurrences={subject?.upcomingOccurrences ?? []}
            />
          </div>

          <div className='mt-5'>
            <CategoriesCard
              amountLabel='Expenses'
              categories={expenseSubcategoryBreakdown.items}
              emptyDescription='Matching subcategory expenses will show up here.'
              isError={subjectQuery.isError}
              isLoading={subjectQuery.isLoading}
              itemLabel='Subcategory'
              periodLabel={periodLabel}
              title='Subcategory breakdown'
              total={expenseSubcategoryBreakdown.total}
              totalVerb='spent'
              type='expense'
            />
          </div>
        </>
      ) : usesIncomeOnlyLayout ? (
        <>
          <div className='mt-8 grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]'>
            <IncomeVsExpensesCard
              data={cashflow}
              displayMode='income-only'
              isError={subjectQuery.isError}
              isLoading={subjectQuery.isLoading}
              title={`${subject?.name ?? 'Subject'} income`}
            />

            <CockpitUpcomingPanel
              isError={subjectQuery.isError}
              isLoading={subjectQuery.isLoading}
              occurrences={subject?.upcomingOccurrences ?? []}
            />
          </div>

          <div className='mt-5'>
            <CategoriesCard
              amountLabel='Income'
              categories={incomeBreakdown.items}
              emptyDescription='Matching income will show up here.'
              isError={subjectQuery.isError}
              isLoading={subjectQuery.isLoading}
              itemLabel='Income line'
              periodLabel={periodLabel}
              title='Income breakdown'
              total={incomeBreakdown.total}
              totalVerb='received'
              type='income'
            />
          </div>
        </>
      ) : (
        <>
          <div className='mt-8 grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]'>
            <IncomeVsExpensesCard
              data={cashflow}
              expenseLabel={`${subject?.name ?? 'Subject'} expenses`}
              isError={subjectQuery.isError}
              isLoading={subjectQuery.isLoading}
              scopedExpenseComparison
            />

            <CategoriesCard
              amountLabel='Expenses'
              categories={expenseBreakdown.items}
              emptyDescription='Matching expenses will show up here.'
              isError={subjectQuery.isError}
              isLoading={subjectQuery.isLoading}
              itemLabel='Expense line'
              periodLabel={periodLabel}
              title='Expense breakdown'
              total={expenseBreakdown.total}
              totalVerb='spent'
              type='expense'
            />
          </div>

          <div className='mt-5 grid gap-5 xl:grid-cols-[minmax(320px,0.9fr)_minmax(0,1.1fr)]'>
            <CategoriesCard
              amountLabel='Income'
              categories={incomeBreakdown.items}
              emptyDescription='Matching income will show up here.'
              isError={subjectQuery.isError}
              isLoading={subjectQuery.isLoading}
              itemLabel='Income line'
              periodLabel={periodLabel}
              title='Income breakdown'
              total={incomeBreakdown.total}
              totalVerb='received'
              type='income'
            />

            <CockpitUpcomingPanel
              isError={subjectQuery.isError}
              isLoading={subjectQuery.isLoading}
              occurrences={subject?.upcomingOccurrences ?? []}
            />
          </div>
        </>
      )}

      <div className='mt-8 overflow-hidden rounded-lg border border-line bg-panel shadow-shell'>
        <div className='flex flex-col gap-2 border-b border-line px-5 py-5 sm:flex-row sm:items-start sm:justify-between'>
          <div>
            <h2 className='text-xl font-semibold tracking-normal text-ink'>
              Recent transactions
            </h2>
            <p className='mt-1 text-sm font-medium text-muted'>
              Matching rows inside {periodLabel}
            </p>
          </div>
        </div>
        <TransactionTableHeader />
        <TransactionsTableContent
          emptyDescription='Matching expenses and income will show up here.'
          emptyTitle='No matching transactions'
          isError={subjectQuery.isError}
          isLoading={subjectQuery.isLoading}
          loadingRowCount={5}
          transactions={subject?.recentTransactions ?? []}
        />
      </div>
    </section>
  );
}

function CockpitSubjectInsightsPanel({
  subject,
}: {
  subject?: CockpitSubjectDetail;
}) {
  const groups = subject?.insights?.groups ?? [];
  const timeline = subject?.insights?.timeline ?? [];
  const showTimeline = subject?.slug === 'salaries' || timeline.length > 0;

  if (groups.length === 0 && !showTimeline) {
    return null;
  }

  return (
    <div className='mt-8 grid gap-5 xl:grid-cols-2'>
      {groups.map((group) => (
        <CockpitInsightGroupCard key={group.title} group={group} />
      ))}
      {showTimeline ? (
        <CockpitInsightTimeline
          items={timeline}
          title={subject?.slug === 'salaries' ? 'Salary periods' : 'Timeline'}
        />
      ) : null}
    </div>
  );
}

function CockpitExpensePieCard({
  categories,
  isError,
  isLoading,
  periodLabel,
  total,
}: {
  categories: CategorySpend[];
  isError: boolean;
  isLoading: boolean;
  periodLabel: string;
  total: number;
}) {
  return (
    <section className='rounded-lg border border-line bg-panel p-5 shadow-shell'>
      <div className='mb-5'>
        <h2 className='text-xl font-semibold tracking-normal text-ink'>
          Subcategory mix
        </h2>
        <p className='mt-1 text-sm font-medium text-muted'>
          {isLoading ? 'Loading totals' : `${formatCurrency(total)} spent`} ·{' '}
          {periodLabel}
        </p>
      </div>

      <CategorySpendChart
        categories={categories}
        emptyDescription='Matching expenses will show up here.'
        emptyTitle='No subcategories yet'
        isError={isError}
        isLoading={isLoading}
        metricLabel='Spent'
        shareLabel='expenses'
        total={total}
      />
    </section>
  );
}

function CockpitInsightGroupCard({ group }: { group: CockpitInsightGroup }) {
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

function CockpitInsightTimeline({
  items,
  title,
}: {
  items: CockpitInsightTimelineItem[];
  title: string;
}) {
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

function getInsightMetricToneClass(tone: CockpitInsightMetricTone): string {
  const toneClass = {
    amber: 'text-accent-amber',
    cyan: 'text-accent-cyan',
    green: 'text-accent-green',
    lavender: 'text-accent-lavender',
    rose: 'text-accent-rose',
  } satisfies Record<CockpitInsightMetricTone, string>;

  return toneClass[tone];
}

function formatInsightMetricValue(value: string): string {
  const amount = Number(value);

  if (!Number.isFinite(amount) || !value.includes('.')) {
    return value;
  }

  return formatCurrency(amount);
}

function formatTimelinePeriod(item: CockpitInsightTimelineItem): string {
  if (item.startDate === null || item.endDate === null) {
    return item.detail;
  }

  if (item.startDate === item.endDate) {
    return formatTransactionDate(item.startDate, { includeYear: true });
  }

  return formatDateRange(item.startDate, item.endDate, { includeYear: true });
}

function CockpitSubjectSummaryTiles({
  isLoading,
  slug,
  subject,
}: {
  isLoading: boolean;
  slug: CockpitSubjectSlug;
  subject?: CockpitSubjectDetail;
}) {
  const isExpenseOnly = isExpenseOnlySubject(slug);
  const isIncomeOnly = isIncomeOnlySubject(slug);
  const incomeTotal = Number(subject?.totals.income ?? 0);
  const expensesTotal = Number(subject?.totals.expenses ?? 0);
  const netTotal = Number(subject?.totals.net ?? 0);
  const hasSurplus = netTotal >= 0;
  const NetIcon = hasSurplus ? TrendingUp : TrendingDown;

  return (
    <div
      className={
        isExpenseOnly
          ? 'grid gap-5 md:grid-cols-2'
          : isIncomeOnly
            ? 'grid gap-5 md:grid-cols-2'
          : 'grid gap-5 md:grid-cols-2 xl:grid-cols-4'
      }
    >
      {isExpenseOnly ? null : (
        <SummaryTile
          badge='Income'
          detail='Matching income'
          footer='Period total'
          icon={<Banknote className='size-5' aria-hidden='true' />}
          label='Income'
          tone='green'
          value={isLoading ? '...' : formatCurrency(incomeTotal)}
        />
      )}
      {isIncomeOnly ? null : (
        <SummaryTile
          badge='Expenses'
          detail='Matching expenses'
          footer='Period total'
          icon={<ReceiptText className='size-5' aria-hidden='true' />}
          label='Expenses'
          tone='lavender'
          value={isLoading ? '...' : formatCurrency(expensesTotal)}
        />
      )}
      {isExpenseOnly || isIncomeOnly ? null : (
        <SummaryTile
          badge={hasSurplus ? 'Surplus' : 'Deficit'}
          detail={hasSurplus ? 'Income less expenses' : 'Expenses over income'}
          footer='Net'
          icon={<NetIcon className='size-5' aria-hidden='true' />}
          label='Net'
          tone={hasSurplus ? 'green' : 'rose'}
          value={isLoading ? '...' : formatCurrency(netTotal)}
        />
      )}
      <SummaryTile
        badge='Upcoming'
        detail={`${subject?.upcoming.count ?? 0} scoped reminder${
          subject?.upcoming.count === 1 ? '' : 's'
        }`}
        footer='Scheduled'
        icon={<CalendarClock className='size-5' aria-hidden='true' />}
        label='Upcoming'
        tone='lavender'
        value={
          isLoading
            ? '...'
            : formatCurrency(Number(subject?.upcoming.total ?? 0))
        }
      />
    </div>
  );
}

function CockpitUpcomingPanel({
  isError,
  isLoading,
  occurrences,
}: {
  isError: boolean;
  isLoading: boolean;
  occurrences: PaymentReminderOccurrence[];
}) {
  return (
    <div className='rounded-lg border border-line bg-panel p-5 shadow-shell'>
      <div className='mb-5 flex items-start justify-between gap-3'>
        <div>
          <h2 className='text-xl font-semibold tracking-normal text-ink'>
            Upcoming payments
          </h2>
          <p className='mt-1 text-sm font-medium text-muted'>
            Scoped reminders in the selected period
          </p>
        </div>
        <span className='flex size-9 shrink-0 items-center justify-center rounded-full border border-accent-cyan/35 text-accent-cyan'>
          <CalendarClock className='size-5' aria-hidden='true' />
        </span>
      </div>

      {isLoading ? (
        <div className='space-y-3'>
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className='h-16 animate-pulse rounded-md bg-canvas/70'
            />
          ))}
        </div>
      ) : isError ? (
        <p className='rounded-md bg-accent-rose/10 px-3 py-3 text-sm font-medium text-muted-strong'>
          Upcoming payments are unavailable.
        </p>
      ) : occurrences.length === 0 ? (
        <p className='rounded-md bg-canvas/70 px-3 py-3 text-sm font-medium text-muted-strong'>
          No scoped payment reminders in this period.
        </p>
      ) : (
        <div className='divide-y divide-line overflow-hidden rounded-md border border-line bg-canvas/70'>
          {occurrences.map((occurrence) => (
            <div
              key={`${occurrence.reminderId}:${occurrence.dueDate}`}
              className='grid gap-3 px-4 py-4 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center'
            >
              <div className='min-w-0'>
                <p className='truncate text-sm font-semibold text-ink'>
                  {occurrence.reminderName}
                </p>
                <p className='mt-1 text-xs font-medium text-muted'>
                  {occurrence.category}
                  {occurrence.subcategory === null
                    ? ''
                    : ` / ${occurrence.subcategory}`}
                </p>
              </div>
              <span className={getOccurrenceStateClass(occurrence.state)}>
                {formatOccurrenceState(occurrence.state)}
              </span>
              <div className='text-left sm:text-right'>
                <p className='text-sm font-bold tabular-nums text-ink'>
                  {formatCurrency(Number(occurrence.amount))}
                </p>
                <p className='mt-1 text-xs font-medium text-muted'>
                  {formatTransactionDate(occurrence.dueDate)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CockpitSubjectNotice({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <div className='mb-5 flex gap-3 rounded-lg border border-accent-rose/35 bg-accent-rose/10 px-4 py-3'>
      <CircleAlert
        className='mt-0.5 size-5 shrink-0 text-accent-rose'
        aria-hidden='true'
      />
      <div>
        <p className='text-sm font-semibold text-accent-rose'>{title}</p>
        <p className='mt-1 text-sm font-medium text-muted-strong'>
          {description}
        </p>
      </div>
    </div>
  );
}

function isCockpitSubjectSlug(
  value: string | undefined,
): value is CockpitSubjectSlug {
  return (
    value !== undefined &&
    COCKPIT_SUBJECT_SLUGS.some((subjectSlug) => subjectSlug === value)
  );
}

function isExpenseOnlySubject(slug: CockpitSubjectSlug): boolean {
  return slug === 'home' || slug === 'car';
}

function isIncomeOnlySubject(slug: CockpitSubjectSlug): boolean {
  return slug === 'salaries';
}

function toIncomeVsExpenses(
  subject: CockpitSubjectDetail,
  dateRange: ReportDateRange,
): IncomeVsExpenses {
  return {
    ...dateRange,
    groupBy: 'month',
    periods: subject.monthlyCashflow.map(toIncomeVsExpensesPeriod),
    totals: subject.totals,
  };
}

function toIncomeVsExpensesPeriod(period: CockpitCashflowPeriod) {
  return {
    ...period,
    expensesAmount: Number(period.expenses),
    incomeAmount: Number(period.income),
    label: formatMonthLabel(period.period),
    netAmount: Number(period.net),
  };
}

function formatMonthLabel(period: string): string {
  const [year = 0, month = 1] = period.split('-').map(Number);

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    year: 'numeric',
  }).format(new Date(year, month - 1, 1));
}

function toCategorySpend(
  breakdown: CockpitBreakdownItem[],
  type: TransactionType,
): {
  items: CategorySpend[];
  total: number;
} {
  const matchingBreakdown = breakdown.filter((item) => item.type === type);
  const total = matchingBreakdown.reduce(
    (sum, item) => sum + Number(item.total),
    0,
  );

  return {
    items: matchingBreakdown.map((item) => {
      const totalAmount = Number(item.total);

      return {
        category:
          item.subcategory === null
            ? item.category
            : `${item.category} / ${item.subcategory}`,
        id: item.subcategoryId ?? item.categoryId,
        share: total > 0 ? totalAmount / total : 0,
        total: item.total,
        totalAmount,
        transactionCount: item.transactionCount,
      };
    }),
    total,
  };
}

function toSubcategorySpend(
  breakdown: CockpitBreakdownItem[],
  type: TransactionType,
): {
  items: CategorySpend[];
  total: number;
} {
  const grouped = new Map<
    string,
    {
      category: string;
      id: number | null;
      totalAmount: number;
      transactionCount: number;
    }
  >();

  for (const item of breakdown) {
    if (item.type !== type) {
      continue;
    }

    const category = item.subcategory ?? item.category;
    const key = normalizeBreakdownLabel(category);
    const current = grouped.get(key) ?? {
      category,
      id: item.subcategoryId ?? item.categoryId,
      totalAmount: 0,
      transactionCount: 0,
    };

    grouped.set(key, {
      ...current,
      totalAmount: current.totalAmount + Number(item.total),
      transactionCount: current.transactionCount + item.transactionCount,
    });
  }

  const rows = Array.from(grouped.values()).sort(
    (left, right) => right.totalAmount - left.totalAmount,
  );
  const total = rows.reduce((sum, row) => sum + row.totalAmount, 0);

  return {
    items: rows.map((row) => ({
      category: row.category,
      id: row.id,
      share: total > 0 ? row.totalAmount / total : 0,
      total: row.totalAmount.toFixed(2),
      totalAmount: row.totalAmount,
      transactionCount: row.transactionCount,
    })),
    total,
  };
}

function normalizeBreakdownLabel(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

function formatOccurrenceState(state: PaymentOccurrenceState): string {
  const labels = {
    dueSoon: 'Due soon',
    overdue: 'Overdue',
    paid: 'Paid',
    skipped: 'Skipped',
    upcoming: 'Upcoming',
  } satisfies Record<PaymentOccurrenceState, string>;

  return labels[state];
}

function getOccurrenceStateClass(state: PaymentOccurrenceState): string {
  const baseClass =
    'inline-flex h-7 items-center justify-center rounded-full px-3 text-xs font-bold uppercase tracking-[0.12em]';
  const toneClass = {
    dueSoon: 'bg-accent-amber/15 text-accent-amber',
    overdue: 'bg-accent-rose/15 text-accent-rose',
    paid: 'bg-accent-green/15 text-accent-green',
    skipped: 'bg-muted/15 text-muted-strong',
    upcoming: 'bg-accent-cyan/15 text-accent-cyan',
  } satisfies Record<PaymentOccurrenceState, string>;

  return `${baseClass} ${toneClass[state]}`;
}
