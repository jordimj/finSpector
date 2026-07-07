import { useAnalyticsReportState } from '../../hooks/useAnalyticsReportState';
import { CategoryBreakdownSection } from './CategoryBreakdownSection';
import { Header } from './Header';
import { InsightCardsGrid } from './InsightCardsGrid';

export function AnalyticsOverview() {
  const report = useAnalyticsReportState();

  return (
    <section className='mx-auto max-w-[1600px]'>
      <Header
        activeComparisonPeriodLabel={report.activeComparisonPeriodLabel}
        categoryAmountType={report.categoryAmountType}
        dateRange={report.dateRange}
        isComparisonActive={report.isComparisonActive}
        isComparisonAvailable={report.isComparisonAvailable}
        isIncomeView={report.isIncomeView}
        isSubcategory={report.isSubcategory}
        pageTitle={report.pageTitle}
        periodLabel={report.periodLabel}
        selectedPresetKey={report.selectedPresetKey}
        onCategoryAmountTypeChange={report.setCategoryAmountType}
        onClearCategory={report.handleClearCategory}
        onComparisonEnabledChange={report.setIsComparisonEnabled}
        onDateRangeChange={report.handleDateRangeChange}
      />

      <InsightCardsGrid report={report} />

      <CategoryBreakdownSection report={report} />
    </section>
  );
}
