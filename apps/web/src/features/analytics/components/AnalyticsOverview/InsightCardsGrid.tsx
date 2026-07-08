import type { CSSProperties } from 'react';
import { IncomeVsExpensesCard } from '../../../../components/IncomeVsExpensesCard';
import { cn } from '../../../../lib/utils';
import { ExpenseBreakdownCard } from '../ExpenseBreakdownCard';
import { useAnalyticsReportState } from '../../hooks/useAnalyticsReportState';

type InsightCardsGridProps = {
  className?: string;
  report: ReturnType<typeof useAnalyticsReportState>;
  style?: CSSProperties;
};

export function InsightCardsGrid({
  className,
  report,
  style,
}: InsightCardsGridProps) {
  return (
    <div
      className={cn(
        'grid gap-5 xl:grid-cols-[minmax(320px,0.82fr)_minmax(0,1.18fr)]',
        className,
      )}
      style={style}
    >
      <ExpenseBreakdownCard
        categories={report.categories}
        emptyDescription={report.emptyDescription}
        emptyTitle={report.emptyTitle}
        isError={report.categorySpend.isError}
        isLoading={report.categorySpend.isLoading}
        metricLabel={report.isIncomeView ? 'Income' : 'Spent'}
        onCategorySelect={
          report.isSubcategory ? undefined : report.handleCategorySelect
        }
        shareLabel={report.amountNoun}
        title={report.allocationTitle}
        total={report.total}
        totalLabel={report.totalLabel}
        comparisonLabel={report.activeComparisonPeriodLabel}
        comparisonTotal={report.activeComparisonCategorySpend?.total}
        comparisonType={report.categoryAmountType}
        isComparisonError={report.comparisonCategorySpend.isError}
        isComparisonLoading={report.comparisonCategorySpend.isLoading}
      />

      <IncomeVsExpensesCard
        data={report.incomeVsExpenses.data}
        comparisonData={report.activeComparisonIncomeVsExpenses}
        comparisonLabel={report.activeComparisonPeriodLabel}
        expenseLabel={
          report.isSubcategory ? report.selectedCategoryLabel : 'Expenses'
        }
        isComparisonError={report.comparisonIncomeVsExpenses.isError}
        isComparisonLoading={report.comparisonIncomeVsExpenses.isLoading}
        isError={report.incomeVsExpenses.isError}
        isLoading={report.incomeVsExpenses.isLoading}
        scopedExpenseComparison={report.isSubcategory}
      />
    </div>
  );
}
