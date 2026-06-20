import {
  Banknote,
  CalendarDays,
  CircleAlert,
  PiggyBank,
  ReceiptText,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { IncomeVsExpensesChart } from '../components/IncomeVsExpensesChart';
import { SummaryTile } from '../components/SummaryTile';
import {
  useProjection,
  type Projection,
  type ProjectionExpenseExclusion,
  type ProjectionIncomeSource,
} from '../hooks/useProjection';
import {
  formatCurrency,
  formatPercentage,
  formatTransactionCurrency,
} from '../utils';

export function ProjectionPage() {
  const projection = useProjection();
  const data = projection.data;
  const incomeTotal = Number(data?.totals.income ?? 0);
  const expensesTotal = Number(data?.totals.expenses ?? 0);
  const netTotal = Number(data?.totals.net ?? incomeTotal - expensesTotal);
  const hasSurplus = netTotal >= 0;
  const hasProjectionValues =
    data?.months.some(
      (month) => month.incomeAmount > 0 || month.expensesAmount > 0,
    ) ?? false;
  const periodLabel =
    data === undefined
      ? 'Current month + 11 months'
      : formatMonthRange(data.projection);
  const historyLabel =
    data === undefined
      ? 'Last 12 completed months'
      : formatMonthRange(data.history);
  const NetIcon = hasSurplus ? TrendingUp : TrendingDown;

  return (
    <section className='mx-auto max-w-[1600px]'>
      <div className='mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
        <div>
          <h1 className='text-3xl font-semibold tracking-normal text-ink md:text-4xl'>
            12-month projection
          </h1>
          <div className='mt-3 flex flex-wrap items-center gap-3'>
            <span className='inline-flex h-6 items-center rounded-full bg-accent-cyan/15 px-3 text-xs font-bold uppercase tracking-[0.14em] text-accent-cyan'>
              Projection
            </span>
            <span className='text-sm font-medium text-muted-strong'>
              {periodLabel} from {historyLabel}
            </span>
          </div>
        </div>
      </div>

      {projection.isError ? (
        <ProjectionNotice
          title='Projection unavailable'
          description='Check that the API is running and the category list can be loaded.'
          tone='rose'
        />
      ) : null}

      {data?.hasMissingConfiguration ? (
        <ProjectionNotice
          title='Projection configuration needs attention'
          description='Some configured expense exclusions or income sources were not found, so those rows are marked below.'
          tone='amber'
        />
      ) : null}

      {data !== undefined && !hasProjectionValues ? (
        <ProjectionNotice
          title='No projection data yet'
          description='The report is ready, but there are no matching historical expenses or configured income rows.'
          tone='lavender'
        />
      ) : null}

      <div className='grid gap-5 md:grid-cols-2 xl:grid-cols-4'>
        <SummaryTile
          badge='Projected'
          detail={periodLabel}
          footer='Income'
          icon={<Banknote className='size-5' aria-hidden='true' />}
          label='Projected income'
          tone='green'
          value={projection.isLoading ? '...' : formatCurrency(incomeTotal)}
        />
        <SummaryTile
          badge='Filtered'
          detail='Default exclusions removed'
          footer='Expenses'
          icon={<ReceiptText className='size-5' aria-hidden='true' />}
          label='Projected expenses'
          tone='lavender'
          value={projection.isLoading ? '...' : formatCurrency(expensesTotal)}
        />
        <SummaryTile
          badge={hasSurplus ? 'Surplus' : 'Deficit'}
          detail={hasSurplus ? 'After expenses' : 'Over projected income'}
          footer='Net'
          icon={<NetIcon className='size-5' aria-hidden='true' />}
          label='Projected net'
          tone={hasSurplus ? 'green' : 'rose'}
          value={projection.isLoading ? '...' : formatCurrency(netTotal)}
        />
        <SummaryTile
          badge='Rate'
          detail='Projected net / income'
          footer='Savings'
          icon={<PiggyBank className='size-5' aria-hidden='true' />}
          label='Savings rate'
          tone={hasSurplus ? 'green' : 'rose'}
          value={
            projection.isLoading || data?.totals.savingsRate === null
              ? '--'
              : formatPercentage(data?.totals.savingsRate ?? 0)
          }
        />
      </div>

      <div className='mt-8 grid gap-5 xl:grid-cols-2'>
        <div className='flex min-h-[34rem] flex-col rounded-lg border border-line bg-panel p-5 shadow-shell'>
          <div className='mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
            <div>
              <h2 className='text-xl font-semibold tracking-normal text-ink'>
                Projected monthly cashflow
              </h2>
              <span className='mt-1 block text-sm font-medium text-muted'>
                Same-month expenses from last year with latest recurring income
              </span>
            </div>
            <div className='flex flex-wrap gap-x-5 gap-y-2 text-xs'>
              <div className='flex items-center gap-2'>
                <span
                  className='size-2 rounded-full bg-accent-green'
                  aria-hidden='true'
                />
                <span className='font-medium text-muted'>Income</span>
              </div>
              <div className='flex items-center gap-2'>
                <span
                  className='size-2 rounded-full bg-accent-lavender'
                  aria-hidden='true'
                />
                <span className='font-medium text-muted'>Expenses</span>
              </div>
            </div>
          </div>

          <IncomeVsExpensesChart
            data={data?.chartData}
            expenseLabel='Expenses'
            isError={projection.isError}
            isLoading={projection.isLoading}
          />
        </div>

        <ProjectionAssumptions data={data} isLoading={projection.isLoading} />
      </div>
    </section>
  );
}

function ProjectionAssumptions({
  data,
  isLoading,
}: {
  data: Projection | undefined;
  isLoading: boolean;
}) {
  return (
    <aside className='h-full rounded-lg border border-line bg-panel p-5 shadow-shell'>
      <div className='mb-5 flex items-start justify-between gap-3'>
        <div>
          <h2 className='text-xl font-semibold tracking-normal text-ink'>
            Assumptions
          </h2>
          <span className='mt-1 block text-sm font-medium text-muted'>
            Defaults used for this projection
          </span>
        </div>
        <span className='flex size-9 items-center justify-center rounded-md bg-accent-cyan/15 text-accent-cyan'>
          <CalendarDays className='size-5' aria-hidden='true' />
        </span>
      </div>

      {isLoading ? (
        <div className='grid gap-3 sm:grid-cols-2'>
          {Array.from({ length: 7 }, (_, index) => (
            <div
              key={index}
              className='h-14 animate-pulse rounded-md bg-panel-raised/70'
            />
          ))}
        </div>
      ) : data === undefined ? (
        <p className='rounded-md bg-panel-raised/70 px-4 py-3 text-sm font-medium text-muted-strong'>
          Projection details are unavailable.
        </p>
      ) : (
        <div className='grid gap-5 lg:grid-cols-2'>
          <div>
            <h3 className='mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-muted-strong'>
              Expense exclusions
            </h3>
            <div className='space-y-2'>
              {data.exclusions.map((exclusion) => (
                <ExclusionRow
                  key={getExclusionKey(exclusion)}
                  item={exclusion}
                />
              ))}
            </div>
          </div>

          <div>
            <h3 className='mb-3 text-sm font-semibold uppercase tracking-[0.12em] text-muted-strong'>
              Income sources
            </h3>
            <div className='space-y-2'>
              {data.incomeSources.map((source) => (
                <IncomeSourceRow key={source.name} source={source} />
              ))}
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}

function ExclusionRow({ item }: { item: ProjectionExpenseExclusion }) {
  const label =
    item.subcategoryName === undefined
      ? item.categoryName
      : `${item.categoryName} / ${item.subcategoryName}`;
  const idLabel =
    item.subcategoryName === undefined ? 'Category ID' : 'Subcategory ID';

  return (
    <div className='rounded-md bg-panel-raised/70 px-4 py-3'>
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <p className='truncate text-sm font-semibold text-ink'>{label}</p>
          <p className='mt-1 text-xs font-medium text-muted'>
            {item.missing ? 'Not found in categories' : `${idLabel} ${item.id}`}
          </p>
        </div>
        <StatusPill missing={item.missing} />
      </div>
    </div>
  );
}

function IncomeSourceRow({ source }: { source: ProjectionIncomeSource }) {
  return (
    <div className='rounded-md bg-panel-raised/70 px-4 py-3'>
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <p className='truncate text-sm font-semibold text-ink'>
            {source.name}
          </p>
          <p className='mt-1 text-xs font-medium text-muted'>
            {getIncomeSourceRule(source.name)}
          </p>
          <p className='mt-2 text-xs font-semibold tabular-nums text-muted-strong'>
            Latest:{' '}
            {source.missing
              ? '--'
              : formatTransactionCurrency(Number(source.latestAmount))}{' '}
            <br />
            Total: {formatTransactionCurrency(Number(source.total))}
          </p>
        </div>
        <StatusPill missing={source.missing} />
      </div>
    </div>
  );
}

function ProjectionNotice({
  description,
  title,
  tone,
}: {
  description: string;
  title: string;
  tone: 'amber' | 'lavender' | 'rose';
}) {
  const toneClass = {
    amber: 'border-accent-amber/35 bg-accent-amber/10 text-accent-amber',
    lavender:
      'border-accent-lavender/35 bg-accent-lavender/10 text-accent-lavender',
    rose: 'border-accent-rose/35 bg-accent-rose/10 text-accent-rose',
  }[tone];

  return (
    <div className={`mb-5 rounded-lg border p-4 ${toneClass}`}>
      <div className='flex gap-3'>
        <CircleAlert className='mt-0.5 size-5 shrink-0' aria-hidden='true' />
        <div>
          <p className='text-sm font-semibold text-ink'>{title}</p>
          <p className='mt-1 text-sm font-medium text-muted-strong'>
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

function StatusPill({ missing }: { missing: boolean }) {
  return (
    <span
      className={[
        'shrink-0 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-[0.12em]',
        missing
          ? 'bg-accent-amber/15 text-accent-amber'
          : 'bg-accent-green/15 text-accent-green',
      ].join(' ')}
    >
      {missing ? 'Missing' : 'Found'}
    </span>
  );
}

function getExclusionKey(item: ProjectionExpenseExclusion): string {
  return `${item.categoryName}:${item.subcategoryName}`;
}

function getIncomeSourceRule(sourceName: string): string {
  if (sourceName === 'Transfe papes') {
    return 'Every month except July and August';
  }

  return 'Every projected month';
}

function formatMonthRange(range: { startMonth: string; endMonth: string }) {
  return `${formatMonth(range.startMonth)} - ${formatMonth(range.endMonth)}`;
}

function formatMonth(month: string) {
  const [year = 0, monthNumber = 1] = month.split('-').map(Number);

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    year: 'numeric',
  }).format(new Date(year, monthNumber - 1, 1));
}
