import { useMemo } from 'react';
import { getRevealStyle } from '../../../../utils/getRevealStyle';
import { AssumptionsPanel } from '../AssumptionsPanel';
import { applyProjectionScenario } from '../../utils/applyProjectionScenario';
import { formatMonthRange } from '../../utils/monthFormatting';
import { useProjection } from '../../hooks/useProjection';
import { useProjectionSettings } from '../../hooks/useProjectionSettings';
import { CashflowChartCard } from './CashflowChartCard';
import { Header } from './Header';
import { Notice } from './Notice';
import { ScheduledPaymentsPanel } from './ScheduledPaymentsPanel';
import { SummaryTiles } from './SummaryTiles';

export function Projection() {
  const [projectionSettings, setProjectionSettings] = useProjectionSettings();
  const projection = useProjection({
    activeExpenseExclusionKeys: projectionSettings.activeExpenseExclusionKeys,
    customExpenseExclusions: projectionSettings.customExpenseExclusions,
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
  const activeExclusionCount =
    baselineData?.exclusions.filter((exclusion) => exclusion.active).length ??
    projectionSettings.activeExpenseExclusionKeys.length +
      projectionSettings.customExpenseExclusions.length;

  return (
    <section className='mx-auto max-w-[1600px]'>
      <Header
        className='dashboard-reveal'
        historyLabel={historyLabel}
        periodLabel={periodLabel}
        style={getRevealStyle(0)}
      />

      {projection.isError ? (
        <Notice
          className='dashboard-reveal'
          title='Projection unavailable'
          description='Check that the API is running and the category list can be loaded.'
          style={getRevealStyle(70)}
          tone='rose'
        />
      ) : null}

      {baselineData?.hasMissingConfiguration ? (
        <Notice
          className='dashboard-reveal'
          title='Projection configuration needs attention'
          description='Some configured expense exclusions or income sources were not found, so those rows are marked below.'
          style={getRevealStyle(70)}
          tone='amber'
        />
      ) : null}

      {data !== undefined && !hasProjectionValues ? (
        <Notice
          className='dashboard-reveal'
          title='No projection data yet'
          description='The report is ready, but there are no matching historical expenses or configured income rows.'
          style={getRevealStyle(70)}
          tone='lavender'
        />
      ) : null}

      <SummaryTiles
        activeExclusionCount={activeExclusionCount}
        expensesTotal={expensesTotal}
        hasSurplus={hasSurplus}
        incomeTotal={incomeTotal}
        isLoading={projection.isLoading}
        netTotal={netTotal}
        periodLabel={periodLabel}
        savingsRate={data?.totals.savingsRate}
      />

      <div className='mt-8 grid gap-5 xl:grid-cols-2'>
        <div className='dashboard-reveal min-w-0' style={getRevealStyle(350)}>
          <CashflowChartCard
            data={data?.chartData}
            isError={projection.isError}
            isLoading={projection.isLoading}
          />
        </div>

        <div
          className='dashboard-reveal h-full min-w-0'
          style={getRevealStyle(420)}
        >
          <AssumptionsPanel
            baselineData={baselineData}
            data={data}
            isLoading={projection.isLoading}
            onSettingsChange={setProjectionSettings}
            settings={projectionSettings}
          />
        </div>
      </div>

      <ScheduledPaymentsPanel
        className='dashboard-reveal'
        isProjectionLoading={projection.isLoading}
        months={data?.months ?? []}
        style={getRevealStyle(490)}
      />
    </section>
  );
}
