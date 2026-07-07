import { Plus, Trash2 } from 'lucide-react';
import type { Projection } from '../../hooks/useProjection';
import type { ProjectionScenarioEvent } from '../../hooks/useProjectionSettings';
import { toNumberInputValue } from '../../utils/assumptionDisplay';
import { MoneyInput } from './MoneyInput';

type OneOffEventsEditorProps = {
  events: ProjectionScenarioEvent[];
  monthOptions: Projection['months'];
  onAddEvent: () => void;
  onEventChange: (
    eventId: string,
    patch: Partial<ProjectionScenarioEvent>,
  ) => void;
  onRemoveEvent: (eventId: string) => void;
};

export function OneOffEventsEditor({
  events,
  monthOptions,
  onAddEvent,
  onEventChange,
  onRemoveEvent,
}: OneOffEventsEditorProps) {
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
