import { RotateCcw, X } from 'lucide-react';
import { useEffect } from 'react';
import { useCategories } from '../../../../hooks/useCategories';
import type { Projection } from '../../hooks/useProjection';
import type {
  ProjectionCustomExpenseExclusion,
  ProjectionScenarioEvent,
  ProjectionSettings,
} from '../../hooks/useProjectionSettings';
import { DialogSection } from './DialogSection';
import { EditableExclusionRow } from './EditableExclusionRow';
import { ExpenseExclusionPicker } from './ExpenseExclusionPicker';
import { OneOffEventsEditor } from './OneOffEventsEditor';

type AssumptionsDialogProps = {
  baselineData: Projection;
  monthOptions: Projection['months'];
  onAddCustomExclusion: (exclusion: ProjectionCustomExpenseExclusion) => void;
  onAddEvent: () => void;
  onClose: () => void;
  onEventChange: (
    eventId: string,
    patch: Partial<ProjectionScenarioEvent>,
  ) => void;
  onExclusionToggle: (exclusionKey: string, active: boolean) => void;
  onRemoveCustomExclusion: (exclusionId: string) => void;
  onRemoveEvent: (eventId: string) => void;
  onReset: () => void;
  settings: ProjectionSettings;
};

export function AssumptionsDialog({
  baselineData,
  monthOptions,
  onAddCustomExclusion,
  onAddEvent,
  onClose,
  onEventChange,
  onExclusionToggle,
  onRemoveCustomExclusion,
  onRemoveEvent,
  onReset,
  settings,
}: AssumptionsDialogProps) {
  const categoriesQuery = useCategories('expense');

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div
      className='fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6 backdrop-blur-sm'
      role='presentation'
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role='dialog'
        aria-modal='true'
        aria-labelledby='projection-assumptions-title'
        className='flex max-h-full w-full max-w-5xl flex-col overflow-hidden rounded-lg border border-line bg-panel shadow-shell'
      >
        <div className='flex shrink-0 items-start justify-between gap-4 border-b border-line px-5 py-4'>
          <div>
            <h2
              id='projection-assumptions-title'
              className='text-xl font-semibold tracking-normal text-ink'
            >
              Change projection assumptions
            </h2>
            <p className='mt-1 text-sm font-medium text-muted'>
              Adjust the baseline rules or add one-off changes.
            </p>
          </div>
          <button
            type='button'
            className='flex size-9 shrink-0 items-center justify-center rounded-md border border-line bg-panel-raised text-muted-strong transition hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-lavender'
            aria-label='Close assumptions dialog'
            onClick={onClose}
          >
            <X className='size-4' aria-hidden='true' />
          </button>
        </div>

        <div className='min-h-0 flex-1 overflow-y-auto px-5 py-5'>
          <div className='grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]'>
            <div className='space-y-5'>
              <DialogSection
                description='These are removed from the historical expense baseline before projecting future months.'
                title='Expense exclusions'
              >
                <ExpenseExclusionPicker
                  categories={categoriesQuery.data ?? []}
                  exclusions={baselineData.exclusions}
                  isLoading={categoriesQuery.isLoading}
                  onAdd={onAddCustomExclusion}
                />

                <div className='mt-3 space-y-2'>
                  {baselineData.exclusions.map((exclusion) => (
                    <EditableExclusionRow
                      key={exclusion.key}
                      exclusion={exclusion}
                      onRemove={onRemoveCustomExclusion}
                      onToggle={onExclusionToggle}
                    />
                  ))}
                </div>
              </DialogSection>
            </div>

            <div className='space-y-5'>
              <DialogSection
                description='Add dated income or expense changes on top of the baseline projection.'
                title='Scenario adjustments'
              >
                <div className='grid gap-4'>
                  <OneOffEventsEditor
                    events={settings.oneOffEvents}
                    monthOptions={monthOptions}
                    onAddEvent={onAddEvent}
                    onEventChange={onEventChange}
                    onRemoveEvent={onRemoveEvent}
                  />
                </div>
              </DialogSection>
            </div>
          </div>
        </div>

        <div className='flex shrink-0 flex-col gap-3 border-t border-line px-5 py-4 sm:flex-row sm:items-center sm:justify-between'>
          <button
            type='button'
            className='inline-flex h-10 items-center justify-center gap-2 rounded-md border border-line bg-panel-raised px-4 text-sm font-semibold text-muted-strong transition hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-lavender'
            onClick={onReset}
          >
            <RotateCcw className='size-4' aria-hidden='true' />
            Reset
          </button>

          <button
            type='button'
            className='inline-flex h-10 items-center justify-center rounded-md border border-line bg-panel-raised px-4 text-sm font-semibold text-muted-strong transition hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-lavender'
            onClick={onClose}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
