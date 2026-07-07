import { SlidersHorizontal } from 'lucide-react';
import {
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import type { Projection } from '../../hooks/useProjection';
import {
  createProjectionEventId,
  projectionDefaultSettings,
  type ProjectionCustomExpenseExclusion,
  type ProjectionScenarioEvent,
  type ProjectionSettings,
} from '../../hooks/useProjectionSettings';
import { getCurrentMonthKey } from '../../utils/assumptionDisplay';
import { AssumptionSkeleton } from './AssumptionSkeleton';
import { AssumptionsDialog } from './AssumptionsDialog';
import { ReadOnlyExclusionsSection } from './ReadOnlyExclusionsSection';
import { ReadOnlyIncomeSection } from './ReadOnlyIncomeSection';
import { ScenarioSummary } from './ScenarioSummary';

type AssumptionsPanelProps = {
  baselineData: Projection | undefined;
  data: Projection | undefined;
  isLoading: boolean;
  onSettingsChange: Dispatch<SetStateAction<ProjectionSettings>>;
  settings: ProjectionSettings;
};

export function AssumptionsPanel({
  baselineData,
  data,
  isLoading,
  onSettingsChange,
  settings,
}: AssumptionsPanelProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const monthOptions = baselineData?.months ?? [];

  const scenarioDelta =
    baselineData !== undefined && data !== undefined
      ? Number(data.totals.net) - Number(baselineData.totals.net)
      : 0;
  const hasScenarioChanges =
    scenarioDelta !== 0 || settings.oneOffEvents.length > 0;

  function updateSettings(
    updater: (current: ProjectionSettings) => ProjectionSettings,
  ) {
    onSettingsChange((current) => updater(current));
  }

  function handleExclusionToggle(exclusionKey: string, active: boolean) {
    updateSettings((current) => {
      const activeKeys = new Set(current.activeExpenseExclusionKeys);

      if (active) {
        activeKeys.add(exclusionKey);
      } else {
        activeKeys.delete(exclusionKey);
      }

      return {
        ...current,
        activeExpenseExclusionKeys:
          projectionDefaultSettings.activeExpenseExclusionKeys.filter((key) =>
            activeKeys.has(key),
          ),
      };
    });
  }

  function handleAddCustomExclusion(
    exclusion: ProjectionCustomExpenseExclusion,
  ) {
    updateSettings((current) => {
      if (
        current.customExpenseExclusions.some(
          (existingExclusion) => existingExclusion.id === exclusion.id,
        )
      ) {
        return current;
      }

      return {
        ...current,
        customExpenseExclusions: [
          ...current.customExpenseExclusions,
          exclusion,
        ],
      };
    });
  }

  function handleRemoveCustomExclusion(exclusionId: string) {
    updateSettings((current) => ({
      ...current,
      customExpenseExclusions: current.customExpenseExclusions.filter(
        (exclusion) => exclusion.id !== exclusionId,
      ),
    }));
  }

  function handleAddEvent() {
    const firstMonth = monthOptions[0]?.month ?? getCurrentMonthKey();

    updateSettings((current) => ({
      ...current,
      oneOffEvents: [
        ...current.oneOffEvents,
        {
          amount: 0,
          id: createProjectionEventId(),
          label: 'One-off event',
          month: firstMonth,
          type: 'expense',
        },
      ],
    }));
  }

  function handleEventChange(
    eventId: string,
    patch: Partial<ProjectionScenarioEvent>,
  ) {
    updateSettings((current) => ({
      ...current,
      oneOffEvents: current.oneOffEvents.map((event) =>
        event.id === eventId ? { ...event, ...patch } : event,
      ),
    }));
  }

  function handleRemoveEvent(eventId: string) {
    updateSettings((current) => ({
      ...current,
      oneOffEvents: current.oneOffEvents.filter(
        (event) => event.id !== eventId,
      ),
    }));
  }

  function handleResetSettings() {
    onSettingsChange({
      ...projectionDefaultSettings,
      activeExpenseExclusionKeys: [
        ...projectionDefaultSettings.activeExpenseExclusionKeys,
      ],
      customExpenseExclusions: [],
      oneOffEvents: [],
    });
  }

  return (
    <>
      <aside className='h-full rounded-lg border border-line bg-panel p-5 shadow-shell'>
        <div className='mb-5 flex items-start justify-between gap-3'>
          <div>
            <h2 className='text-xl font-semibold tracking-normal text-ink'>
              Assumptions
            </h2>
            <span className='mt-1 block text-sm font-medium text-muted'>
              Defaults used for this projection
            </span>
          </div>
          <button
            type='button'
            className='inline-flex h-9 shrink-0 items-center gap-2 rounded-md border border-line bg-panel-raised px-3 text-sm font-semibold text-muted-strong transition hover:text-ink focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-lavender'
            onClick={() => setIsDialogOpen(true)}
          >
            <SlidersHorizontal className='size-4' aria-hidden='true' />
            Change
          </button>
        </div>

        {isLoading ? (
          <AssumptionSkeleton />
        ) : baselineData === undefined ? (
          <p className='rounded-md bg-panel-raised/70 px-4 py-3 text-sm font-medium text-muted-strong'>
            Projection details are unavailable.
          </p>
        ) : (
          <div className='grid gap-5 lg:grid-cols-2'>
            {hasScenarioChanges ? (
              <ScenarioSummary
                scenarioDelta={scenarioDelta}
                settings={settings}
              />
            ) : null}

            <ReadOnlyExclusionsSection exclusions={baselineData.exclusions} />

            <ReadOnlyIncomeSection sources={baselineData.incomeSources} />
          </div>
        )}
      </aside>

      {isDialogOpen && baselineData !== undefined ? (
        <AssumptionsDialog
          baselineData={baselineData}
          monthOptions={monthOptions}
          onAddCustomExclusion={handleAddCustomExclusion}
          onAddEvent={handleAddEvent}
          onClose={() => setIsDialogOpen(false)}
          onEventChange={handleEventChange}
          onExclusionToggle={handleExclusionToggle}
          onRemoveCustomExclusion={handleRemoveCustomExclusion}
          onRemoveEvent={handleRemoveEvent}
          onReset={handleResetSettings}
          settings={settings}
        />
      ) : null}
    </>
  );
}
