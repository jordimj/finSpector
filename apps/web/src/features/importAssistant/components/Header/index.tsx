import { Download } from 'lucide-react';
import type {
  ExportCsvMode,
  ExportCsvPeriod,
  ExportMonthOption,
} from '../../types';
import {
  exportCsvModeOptions,
  exportCsvPeriodFromSelectValue,
  exportCsvPeriodToSelectValue,
} from '../../utils/csvExport';

export function Header({
  exportCsvMode,
  exportCsvPeriod,
  exportMonthOptions,
  exportableRowCount,
  hasRows,
  onDownloadCsv,
  onExportCsvModeChange,
  onExportCsvPeriodChange,
}: {
  exportCsvMode: ExportCsvMode;
  exportCsvPeriod: ExportCsvPeriod;
  exportMonthOptions: ExportMonthOption[];
  exportableRowCount: number;
  hasRows: boolean;
  onDownloadCsv: () => void;
  onExportCsvModeChange: (mode: ExportCsvMode) => void;
  onExportCsvPeriodChange: (period: ExportCsvPeriod) => void;
}) {
  return (
    <div className='flex shrink-0 flex-col gap-3 lg:flex-row lg:items-end lg:justify-between'>
      <div>
        <h1 className='text-2xl font-semibold tracking-normal text-ink md:text-3xl'>
          Import assistant
        </h1>
        <p className='mt-1 max-w-3xl text-sm font-medium leading-5 text-muted-strong'>
          Upload a statement, review suggested categories, and export a CSV.
        </p>
      </div>

      {hasRows ? (
        <div className='flex shrink-0 flex-col gap-2 sm:flex-row sm:items-end'>
          <select
            className='h-10 rounded-md border border-line bg-panel px-3 text-sm font-semibold text-muted-strong outline-none transition focus:border-accent-lavender focus:ring-2 focus:ring-accent-lavender/25'
            value={exportCsvMode}
            onChange={(event) =>
              onExportCsvModeChange(event.target.value as ExportCsvMode)
            }
          >
            {exportCsvModeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          <select
            className='h-10 rounded-md border border-line bg-panel px-3 text-sm font-semibold text-muted-strong outline-none transition focus:border-accent-lavender focus:ring-2 focus:ring-accent-lavender/25'
            value={exportCsvPeriodToSelectValue(exportCsvPeriod)}
            onChange={(event) =>
              onExportCsvPeriodChange(
                exportCsvPeriodFromSelectValue(event.target.value),
              )
            }
          >
            <option value='all'>All dates</option>
            {exportMonthOptions.map((option) => (
              <option key={option.month} value={`month:${option.month}`}>
                {option.label}
              </option>
            ))}
          </select>

          <button
            type='button'
            className='inline-flex h-10 items-center justify-center gap-2 rounded-md border border-line bg-panel-raised px-4 text-sm font-semibold text-muted-strong transition hover:text-ink disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-lavender'
            disabled={exportableRowCount === 0}
            onClick={onDownloadCsv}
            title={
              exportableRowCount === 0
                ? 'No rows match this CSV export selection'
                : undefined
            }
          >
            <Download className='size-4' aria-hidden='true' />
            Download CSV ({exportableRowCount})
          </button>
        </div>
      ) : null}
    </div>
  );
}
