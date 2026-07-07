import {
  DateRangePicker,
  type DateRangePresetKey,
} from '../../../../components/DateRangePicker';
import type { ReportDateRange } from '../../../../types';

type HeaderProps = {
  dateRange: ReportDateRange;
  periodLabel: string;
  selectedPresetKey: DateRangePresetKey | null;
  onDateRangeChange: (
    nextDateRange: ReportDateRange,
    nextPresetKey: DateRangePresetKey | null,
  ) => void;
};

export function Header({
  dateRange,
  periodLabel,
  selectedPresetKey,
  onDateRangeChange,
}: HeaderProps) {
  return (
    <div className='mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
      <div>
        <h1 className='text-3xl font-semibold tracking-normal text-ink md:text-4xl'>
          Cockpit
        </h1>
        <div className='mt-3 flex flex-wrap items-center gap-3'>
          <span className='inline-flex h-6 items-center rounded-full bg-accent-cyan/15 px-3 text-xs font-bold uppercase tracking-[0.14em] text-accent-cyan'>
            Subject view
          </span>
          <span className='text-sm font-medium text-muted-strong'>
            Period: {periodLabel}
          </span>
        </div>
      </div>

      <DateRangePicker
        dateRange={dateRange}
        id='cockpit'
        selectedPresetKey={selectedPresetKey}
        onChange={onDateRangeChange}
      />
    </div>
  );
}
