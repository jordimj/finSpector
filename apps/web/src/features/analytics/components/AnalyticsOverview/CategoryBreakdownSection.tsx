import type { CSSProperties } from 'react';
import { CategoriesCard } from '../../../../components/CategoriesCard';
import { cn } from '../../../../lib/utils';
import { useAnalyticsReportState } from '../../hooks/useAnalyticsReportState';

type CategoryBreakdownSectionProps = {
  className?: string;
  report: ReturnType<typeof useAnalyticsReportState>;
  style?: CSSProperties;
};

export function CategoryBreakdownSection({
  className,
  report,
  style,
}: CategoryBreakdownSectionProps) {
  return (
    <div className={cn('mt-5', className)} style={style}>
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
