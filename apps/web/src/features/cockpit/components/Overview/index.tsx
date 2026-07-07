import { useState } from 'react';
import type { CockpitSubjectSummary } from '@finance/shared';
import type { DateRangePresetKey } from '../../../../components/DateRangePicker';
import type { ReportDateRange } from '../../../../types';
import { formatReportDateRange, getCurrentYearRange } from '../../../../utils';
import { useCockpitSubjects } from '../../hooks/useCockpitSubjects';
import { cockpitSections } from '../../utils/cockpitSections';
import { isSubjectSummary } from '../../utils/cockpitSubjects';
import { SubjectSection } from '../SubjectSection';
import { Header } from './Header';
import { Notice } from './Notice';

export function Overview() {
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

  function handleDateRangeChange(
    nextDateRange: ReportDateRange,
    nextPresetKey: DateRangePresetKey | null,
  ) {
    setDateRange(nextDateRange);
    setSelectedPresetKey(nextPresetKey);
  }

  return (
    <section className='mx-auto max-w-[1600px]'>
      <Header
        dateRange={dateRange}
        periodLabel={periodLabel}
        selectedPresetKey={selectedPresetKey}
        onDateRangeChange={handleDateRangeChange}
      />

      {subjects.isError ? (
        <Notice
          description='Check that the API is running and the cockpit routes are available.'
          title='Cockpit subjects unavailable'
        />
      ) : null}

      <div className='space-y-9'>
        {cockpitSections.map((section) => (
          <SubjectSection
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
