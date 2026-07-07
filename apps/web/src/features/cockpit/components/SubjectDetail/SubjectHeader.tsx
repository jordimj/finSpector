import type { CockpitSubjectDetail, CockpitSubjectSlug } from '@finance/shared';
import {
  DateRangePicker,
  type DateRangePresetKey,
} from '../../../../components/DateRangePicker';
import type { ReportDateRange } from '../../../../types';
import { BackLink } from './BackLink';

type SubjectHeaderProps = {
  dateRange: ReportDateRange;
  periodLabel: string;
  selectedPresetKey: DateRangePresetKey | null;
  slug: CockpitSubjectSlug;
  subject?: CockpitSubjectDetail;
  onDateRangeChange: (
    nextDateRange: ReportDateRange,
    nextPresetKey: DateRangePresetKey | null,
  ) => void;
};

export function SubjectHeader({
  dateRange,
  periodLabel,
  selectedPresetKey,
  slug,
  subject,
  onDateRangeChange,
}: SubjectHeaderProps) {
  return (
    <div className='mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
      <div>
        <BackLink className='mb-3' />
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
        onChange={onDateRangeChange}
      />
    </div>
  );
}
