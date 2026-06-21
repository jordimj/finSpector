import {
  Banknote,
  CircleAlert,
  PiggyBank,
  ReceiptText,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useMemo } from 'react';
import { IncomeVsExpensesChart } from '../components/IncomeVsExpensesChart';
import { ProjectionAssumptionsPanel } from '../components/ProjectionAssumptionsPanel';
import { SummaryTile } from '../components/SummaryTile';
import { useProjection } from '../hooks/useProjection';
import { useProjectionSettings } from '../hooks/useProjectionSettings';
import { formatCurrency, formatPercentage } from '../utils';
import { applyProjectionScenario } from '../utils/projectionScenario';

export function ProjectionPage() {
  const [projectionSettings, setProjectionSettings] = useProjectionSettings();
  const projection = useProjection({
    activeExpenseExclusionKeys:
      projectionSettings.activeExpenseExclusionKeys,
  });
  const baselineData = projection.data;
  const data = useMemo(
    () =>
      baselineData === undefined
        ? undefined
        : applyProjectionScenario(baselineData, projectionSettings),
    [baselineData, projectionSettings],
  );
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
  const activeExclusionCount =
    projectionSettings.activeExpenseExclusionKeys.length;

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

      {baselineData?.hasMissingConfiguration ? (
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
          badge='Editable'
          detail={`${activeExclusionCount} exclusions applied`}
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
                Same-month expenses from last year with editable assumptions
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

        <ProjectionAssumptionsPanel
          baselineData={baselineData}
          data={data}
          isLoading={projection.isLoading}
          onSettingsChange={setProjectionSettings}
          settings={projectionSettings}
        />
      </div>
    </section>
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
