import {
  Check,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Trash2,
  X,
} from 'lucide-react';
import {
  useEffect,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import type {
  Projection,
  ProjectionExpenseExclusion,
  ProjectionIncomeSource,
} from '../hooks/useProjection';
import {
  projectionDefaultSettings,
  type ProjectionScenarioEvent,
  type ProjectionSettings,
} from '../hooks/useProjectionSettings';
import { cn } from '../lib/utils';
import { formatSignedCurrency, formatTransactionCurrency } from '../utils';

type ProjectionAssumptionsPanelProps = {
  baselineData: Projection | undefined;
  data: Projection | undefined;
  isLoading: boolean;
  onSettingsChange: Dispatch<SetStateAction<ProjectionSettings>>;
  settings: ProjectionSettings;
};

export function ProjectionAssumptionsPanel({
  baselineData,
  data,
  isLoading,
  onSettingsChange,
  settings,
}: ProjectionAssumptionsPanelProps) {
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
          onAddEvent={handleAddEvent}
          onClose={() => setIsDialogOpen(false)}
          onEventChange={handleEventChange}
          onExclusionToggle={handleExclusionToggle}
          onRemoveEvent={handleRemoveEvent}
          onReset={handleResetSettings}
          settings={settings}
        />
      ) : null}
    </>
  );
}

function ScenarioSummary({
  scenarioDelta,
  settings,
}: {
  scenarioDelta: number;
  settings: ProjectionSettings;
}) {
  return (
    <div className='rounded-md border border-accent-cyan/30 bg-accent-cyan/10 px-4 py-3 lg:col-span-2'>
      <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <p className='text-sm font-semibold text-ink'>
            One-off events active
          </p>
          <p className='mt-1 text-xs font-medium text-muted-strong'>
            {settings.oneOffEvents.length} one-off event
            {settings.oneOffEvents.length === 1 ? '' : 's'}
          </p>
        </div>
        <span
          className={cn(
            'text-sm font-bold tabular-nums',
            scenarioDelta >= 0 ? 'text-accent-green' : 'text-accent-rose',
          )}
        >
          {formatSignedCurrency(scenarioDelta)}
        </span>
      </div>
    </div>
  );
}

function ReadOnlyExclusionsSection({
  exclusions,
}: {
  exclusions: ProjectionExpenseExclusion[];
}) {
  return (
    <section className='min-w-0'>
      <div className='mb-3 flex items-center justify-between gap-3'>
        <h3 className='text-sm font-semibold uppercase tracking-[0.12em] text-muted-strong'>
          Expense exclusions
        </h3>
        <span className='text-xs font-semibold tabular-nums text-muted'>
          {exclusions.filter((exclusion) => exclusion.active).length} active
        </span>
      </div>
      <div className='divide-y divide-line rounded-md bg-panel-raised/70 px-3'>
        {exclusions.map((exclusion) => (
          <ReadOnlyExclusionRow key={exclusion.key} exclusion={exclusion} />
        ))}
      </div>
    </section>
  );
}

function ReadOnlyExclusionRow({
  exclusion,
}: {
  exclusion: ProjectionExpenseExclusion;
}) {
  const label = getExclusionLabel(exclusion);

  return (
    <div className='flex items-center justify-between gap-3 py-2.5'>
      <div className='min-w-0'>
        <p className='truncate text-sm font-semibold text-ink'>{label}</p>
        <p className='mt-0.5 text-xs font-medium text-muted'>
          {exclusion.missing
            ? 'Not found'
            : exclusion.active
              ? 'Excluded from baseline'
              : 'Included in baseline'}
        </p>
      </div>
      <StatusPill
        label={
          exclusion.missing
            ? 'Missing'
            : exclusion.active
              ? 'Excluded'
              : 'Included'
        }
        tone={
          exclusion.missing ? 'amber' : exclusion.active ? 'green' : 'muted'
        }
      />
    </div>
  );
}

function ReadOnlyIncomeSection({
  sources,
}: {
  sources: ProjectionIncomeSource[];
}) {
  return (
    <section className='min-w-0'>
      <div className='mb-3 flex items-center justify-between gap-3'>
        <h3 className='text-sm font-semibold uppercase tracking-[0.12em] text-muted-strong'>
          Income sources
        </h3>
        <span className='text-xs font-semibold tabular-nums text-muted'>
          {sources.length} rules
        </span>
      </div>
      <div className='divide-y divide-line rounded-md bg-panel-raised/70 px-3'>
        {sources.map((source) => (
          <ReadOnlyIncomeRow key={source.name} source={source} />
        ))}
      </div>
    </section>
  );
}

function ReadOnlyIncomeRow({ source }: { source: ProjectionIncomeSource }) {
  return (
    <div className='flex items-start justify-between gap-3 py-2.5'>
      <div className='min-w-0'>
        <p className='truncate text-sm font-semibold text-ink'>{source.name}</p>
        <p className='mt-0.5 truncate text-xs font-medium text-muted'>
          {getIncomeSourceRule(source)}
        </p>
      </div>
      <div className='shrink-0 text-right'>
        <p className='text-sm font-semibold tabular-nums text-ink'>
          {source.missing
            ? '--'
            : formatTransactionCurrency(Number(source.latestAmount))}
        </p>
        <p className='mt-0.5 text-xs font-semibold tabular-nums text-muted-strong'>
          {formatTransactionCurrency(Number(source.total))}
        </p>
      </div>
    </div>
  );
}

function AssumptionsDialog({
  baselineData,
  monthOptions,
  onAddEvent,
  onClose,
  onEventChange,
  onExclusionToggle,
  onRemoveEvent,
  onReset,
  settings,
}: {
  baselineData: Projection;
  monthOptions: Projection['months'];
  onAddEvent: () => void;
  onClose: () => void;
  onEventChange: (
    eventId: string,
    patch: Partial<ProjectionScenarioEvent>,
  ) => void;
  onExclusionToggle: (exclusionKey: string, active: boolean) => void;
  onRemoveEvent: (eventId: string) => void;
  onReset: () => void;
  settings: ProjectionSettings;
}) {
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
                <div className='space-y-2'>
                  {baselineData.exclusions.map((exclusion) => (
                    <EditableExclusionRow
                      key={exclusion.key}
                      exclusion={exclusion}
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

function DialogSection({
  children,
  description,
  title,
}: {
  children: ReactNode;
  description: string;
  title: string;
}) {
  return (
    <section className='rounded-md border border-line bg-panel-raised/70 p-4'>
      <h3 className='text-sm font-semibold uppercase tracking-[0.12em] text-muted-strong'>
        {title}
      </h3>
      <p className='mt-1 text-sm font-medium text-muted'>{description}</p>
      <div className='mt-4'>{children}</div>
    </section>
  );
}

function EditableExclusionRow({
  exclusion,
  onToggle,
}: {
  exclusion: ProjectionExpenseExclusion;
  onToggle: (exclusionKey: string, active: boolean) => void;
}) {
  return (
    <label className='flex cursor-pointer items-start gap-3 rounded-md bg-canvas/70 px-3 py-2 transition hover:bg-canvas'>
      <input
        type='checkbox'
        className='peer sr-only'
        checked={exclusion.active}
        onChange={(event) =>
          onToggle(exclusion.key, event.currentTarget.checked)
        }
      />
      <span
        className={cn(
          'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded border border-line bg-panel text-transparent transition peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent-lavender',
          exclusion.active && 'border-accent-cyan bg-accent-cyan text-canvas',
        )}
        aria-hidden='true'
      >
        <Check className='size-3.5' />
      </span>
      <span className='min-w-0'>
        <span className='block truncate text-sm font-semibold text-ink'>
          {getExclusionLabel(exclusion)}
        </span>
        <span className='mt-0.5 block text-xs font-medium text-muted'>
          {exclusion.missing
            ? 'Not found in categories'
            : exclusion.active
              ? 'Excluded from baseline'
              : 'Included in baseline'}
        </span>
      </span>
    </label>
  );
}

function OneOffEventsEditor({
  events,
  monthOptions,
  onAddEvent,
  onEventChange,
  onRemoveEvent,
}: {
  events: ProjectionScenarioEvent[];
  monthOptions: Projection['months'];
  onAddEvent: () => void;
  onEventChange: (
    eventId: string,
    patch: Partial<ProjectionScenarioEvent>,
  ) => void;
  onRemoveEvent: (eventId: string) => void;
}) {
  return (
    <div>
      <div className='mb-2 flex items-center justify-between gap-3'>
        <h4 className='text-xs font-semibold uppercase tracking-[0.12em] text-muted-strong'>
          One-off events
        </h4>
        <button
          type='button'
          className='inline-flex h-9 items-center gap-2 rounded-md border border-line bg-canvas px-3 text-sm font-semibold text-muted-strong transition hover:text-ink disabled:cursor-not-allowed disabled:opacity-50'
          disabled={monthOptions.length === 0}
          onClick={onAddEvent}
        >
          <Plus className='size-4' aria-hidden='true' />
          Add
        </button>
      </div>

      {events.length === 0 ? (
        <p className='rounded-md bg-canvas/70 px-3 py-2 text-sm font-medium text-muted-strong'>
          No one-off scenario events.
        </p>
      ) : (
        <div className='space-y-2'>
          {events.map((event) => (
            <div key={event.id} className='rounded-md bg-canvas/70 p-3'>
              <div className='flex items-start gap-2'>
                <input
                  type='text'
                  className='h-9 min-w-0 flex-1 rounded-md border border-line bg-panel px-3 text-sm font-semibold text-ink outline-none transition focus:border-accent-lavender'
                  aria-label='Event label'
                  value={event.label}
                  onChange={(inputEvent) =>
                    onEventChange(event.id, {
                      label: inputEvent.currentTarget.value,
                    })
                  }
                />
                <button
                  type='button'
                  className='flex size-9 items-center justify-center rounded-md border border-line bg-panel text-muted-strong transition hover:text-accent-rose'
                  aria-label={`Remove ${event.label}`}
                  onClick={() => onRemoveEvent(event.id)}
                >
                  <Trash2 className='size-4' aria-hidden='true' />
                </button>
              </div>

              <div className='mt-2 grid gap-2 sm:grid-cols-3'>
                <select
                  className='h-9 rounded-md border border-line bg-panel px-2 text-sm font-semibold text-ink outline-none transition focus:border-accent-lavender'
                  aria-label='Event month'
                  value={event.month}
                  onChange={(selectEvent) =>
                    onEventChange(event.id, {
                      month: selectEvent.currentTarget.value,
                    })
                  }
                >
                  {monthOptions.map((month) => (
                    <option key={month.month} value={month.month}>
                      {month.label}
                    </option>
                  ))}
                </select>

                <select
                  className='h-9 rounded-md border border-line bg-panel px-2 text-sm font-semibold text-ink outline-none transition focus:border-accent-lavender'
                  aria-label='Event type'
                  value={event.type}
                  onChange={(selectEvent) =>
                    onEventChange(event.id, {
                      type:
                        selectEvent.currentTarget.value === 'income'
                          ? 'income'
                          : 'expense',
                    })
                  }
                >
                  <option value='expense'>Expense</option>
                  <option value='income'>Income</option>
                </select>

                <MoneyInput
                  min={0}
                  value={event.amount}
                  onChange={(value) =>
                    onEventChange(event.id, {
                      amount: Math.abs(toNumberInputValue(value)),
                    })
                  }
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MoneyInput({
  min,
  onChange,
  value,
}: {
  min?: number;
  onChange: (value: string) => void;
  value: number;
}) {
  return (
    <div className='flex h-9 items-center overflow-hidden rounded-md border border-line bg-panel text-sm font-semibold text-ink focus-within:border-accent-lavender'>
      <span className='border-r border-line px-2 text-xs text-muted'>EUR</span>
      <input
        type='number'
        step='10'
        min={min}
        className='h-full min-w-0 flex-1 bg-transparent px-2 text-right outline-none'
        value={value}
        onChange={(event) => onChange(event.currentTarget.value)}
      />
    </div>
  );
}

function StatusPill({
  label,
  tone,
}: {
  label: string;
  tone: 'amber' | 'green' | 'muted';
}) {
  const toneClass = {
    amber: 'bg-accent-amber/15 text-accent-amber',
    green: 'bg-accent-green/15 text-accent-green',
    muted: 'bg-muted/15 text-muted',
  }[tone];

  return (
    <span
      className={cn(
        'shrink-0 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-[0.12em]',
        toneClass,
      )}
    >
      {label}
    </span>
  );
}

function AssumptionSkeleton() {
  return (
    <div className='grid gap-3 sm:grid-cols-2'>
      {Array.from({ length: 7 }, (_, index) => (
        <div
          key={index}
          className='h-14 animate-pulse rounded-md bg-panel-raised/70'
        />
      ))}
    </div>
  );
}

function getExclusionLabel(exclusion: ProjectionExpenseExclusion): string {
  return exclusion.subcategoryName === undefined
    ? exclusion.categoryName
    : `${exclusion.categoryName} / ${exclusion.subcategoryName}`;
}

function getIncomeSourceRule(source: ProjectionIncomeSource): string {
  if (source.excludedMonthNumbers.length === 0) {
    return 'Every projected month';
  }

  return `Every month except ${source.excludedMonthNumbers
    .map(formatMonthNumber)
    .join(', ')}`;
}

function formatMonthNumber(monthNumber: number): string {
  return new Intl.DateTimeFormat(undefined, { month: 'short' }).format(
    new Date(2024, monthNumber - 1, 1),
  );
}

function toNumberInputValue(value: string): number {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : 0;
}

function getCurrentMonthKey(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');

  return `${now.getFullYear()}-${month}`;
}

function createProjectionEventId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
