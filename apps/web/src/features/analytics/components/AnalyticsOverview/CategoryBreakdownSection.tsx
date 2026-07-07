import { CategoriesCard } from '../../../../components/CategoriesCard';
import { useAnalyticsReportState } from '../../hooks/useAnalyticsReportState';

type CategoryBreakdownSectionProps = {
  report: ReturnType<typeof useAnalyticsReportState>;
};

export function CategoryBreakdownSection({
  report,
}: CategoryBreakdownSectionProps) {
  return (
    <div className='mt-5'>
      <CategoriesCard
        amountLabel={report.isIncomeView ? 'Income' : 'Spend'}
        categories={report.categories}
        comparisonCategories={
          report.activeComparisonCategorySpend?.categories
        }
        comparisonLabel={report.activeComparisonPeriodLabel}
        emptyDescription={report.emptyDescription}
        isComparisonError={report.comparisonCategorySpend.isError}
        isComparisonLoading={report.comparisonCategorySpend.isLoading}
        isError={report.categorySpend.isError}
        isLoading={report.categorySpend.isLoading}
        itemLabel={report.isSubcategory ? 'Subcategory' : 'Category'}
        onCategorySelect={
          report.isSubcategory ? undefined : report.handleCategorySelect
        }
        periodLabel={report.periodLabel}
        title={report.breakdownTitle}
        total={report.total}
        totalVerb={report.isIncomeView ? 'received' : 'spent'}
        type={report.categoryAmountType}
      />
    </div>
  );
}
