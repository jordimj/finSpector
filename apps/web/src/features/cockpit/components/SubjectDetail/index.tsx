import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { DateRangePresetKey } from '../../../../components/DateRangePicker';
import type { ReportDateRange } from '../../../../types';
import { formatReportDateRange, getCurrentYearRange } from '../../../../utils';
import { useCockpitSubject } from '../../hooks/useCockpitSubjects';
import {
  isCockpitSubjectSlug,
  isExpenseOnlySubject,
  isIncomeOnlySubject,
} from '../../utils/cockpitSubjects';
import {
  toCategorySpend,
  toIncomeVsExpenses,
  toSubcategorySpend,
} from '../../utils/subjectDetailAdapters';
import { SubjectHeader } from './SubjectHeader';
import { SubjectInsightsPanel } from './SubjectInsightsPanel';
import { SubjectNotFound } from './SubjectNotFound';
import { SubjectNotice } from './SubjectNotice';
import { SubjectRecentTransactionsCard } from './SubjectRecentTransactionsCard';
import { SubjectSummaryTiles } from './SubjectSummaryTiles';
import { ExpenseOnlySubjectSections } from './ExpenseOnlySubjectSections';
import { IncomeOnlySubjectSections } from './IncomeOnlySubjectSections';
import { MixedSubjectSections } from './MixedSubjectSections';

export function SubjectDetail() {
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
    return <SubjectNotFound />;
  }

  const usesExpenseOnlyLayout = isExpenseOnlySubject(slug);
  const usesIncomeOnlyLayout = isIncomeOnlySubject(slug);
  const isLoading = subjectQuery.isLoading;
  const isError = subjectQuery.isError;
  const subjectName = subject?.name ?? 'Subject';
  const upcomingOccurrences = subject?.upcomingOccurrences ?? [];

  function handleDateRangeChange(
    nextDateRange: ReportDateRange,
    nextPresetKey: DateRangePresetKey | null,
  ) {
    setDateRange(nextDateRange);
    setSelectedPresetKey(nextPresetKey);
  }

  return (
    <section className='mx-auto max-w-[1600px]'>
      <SubjectHeader
        dateRange={dateRange}
        periodLabel={periodLabel}
        selectedPresetKey={selectedPresetKey}
        slug={slug}
        subject={subject}
        onDateRangeChange={handleDateRangeChange}
      />

      {isError ? (
        <SubjectNotice
          description='Check that the API is running and this subject can be loaded.'
          title='Subject unavailable'
        />
      ) : null}

      <SubjectSummaryTiles
        isLoading={isLoading}
        slug={slug}
        subject={subject}
      />

      <SubjectInsightsPanel subject={subject} />

      {usesExpenseOnlyLayout ? (
        <ExpenseOnlySubjectSections
          expenseSubcategoryBreakdown={expenseSubcategoryBreakdown}
          isError={isError}
          isLoading={isLoading}
          periodLabel={periodLabel}
          upcomingOccurrences={upcomingOccurrences}
        />
      ) : usesIncomeOnlyLayout ? (
        <IncomeOnlySubjectSections
          cashflow={cashflow}
          incomeBreakdown={incomeBreakdown}
          isError={isError}
          isLoading={isLoading}
          periodLabel={periodLabel}
          subjectName={subjectName}
          upcomingOccurrences={upcomingOccurrences}
        />
      ) : (
        <MixedSubjectSections
          cashflow={cashflow}
          expenseBreakdown={expenseBreakdown}
          incomeBreakdown={incomeBreakdown}
          isError={isError}
          isLoading={isLoading}
          periodLabel={periodLabel}
          subjectName={subjectName}
          upcomingOccurrences={upcomingOccurrences}
        />
      )}

      <SubjectRecentTransactionsCard
        isError={isError}
        isLoading={isLoading}
        periodLabel={periodLabel}
        transactions={subject?.recentTransactions ?? []}
      />
    </section>
  );
}
