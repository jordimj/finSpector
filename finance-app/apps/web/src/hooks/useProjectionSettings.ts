import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { projectionDefaultExpenseExclusionKeys } from './useProjection';

export type ProjectionScenarioEventType = 'expense' | 'income';

export type ProjectionScenarioEvent = {
  amount: number;
  id: string;
  label: string;
  month: string;
  type: ProjectionScenarioEventType;
};

export type ProjectionSettings = {
  activeExpenseExclusionKeys: string[];
  oneOffEvents: ProjectionScenarioEvent[];
};

const storageKey = 'finance.projection.settings.v1';
const monthPattern = /^\d{4}-\d{2}$/;
const validExclusionKeys: ReadonlySet<string> = new Set(
  projectionDefaultExpenseExclusionKeys,
);

export const projectionDefaultSettings: ProjectionSettings = {
  activeExpenseExclusionKeys: [...projectionDefaultExpenseExclusionKeys],
  oneOffEvents: [],
};

export function useProjectionSettings(): [
  ProjectionSettings,
  Dispatch<SetStateAction<ProjectionSettings>>,
] {
  const [settings, setSettings] = useState<ProjectionSettings>(
    loadProjectionSettings,
  );

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(settings));
  }, [settings]);

  return [settings, setSettings];
}

function loadProjectionSettings(): ProjectionSettings {
  if (typeof window === 'undefined') {
    return projectionDefaultSettings;
  }

  try {
    const storedValue = window.localStorage.getItem(storageKey);

    if (storedValue === null) {
      return projectionDefaultSettings;
    }

    return normalizeProjectionSettings(JSON.parse(storedValue));
  } catch {
    return projectionDefaultSettings;
  }
}

function normalizeProjectionSettings(value: unknown): ProjectionSettings {
  if (!isRecord(value)) {
    return projectionDefaultSettings;
  }

  return {
    activeExpenseExclusionKeys: normalizeExclusionKeys(
      value.activeExpenseExclusionKeys,
    ),
    oneOffEvents: normalizeOneOffEvents(value.oneOffEvents),
  };
}

function normalizeExclusionKeys(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [...projectionDefaultExpenseExclusionKeys];
  }

  return value.flatMap((item) =>
    typeof item === 'string' && validExclusionKeys.has(item) ? [item] : [],
  );
}

function normalizeOneOffEvents(value: unknown): ProjectionScenarioEvent[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.flatMap((item) => {
    if (!isRecord(item)) {
      return [];
    }

    const id = typeof item.id === 'string' ? item.id : createProjectionEventId();
    const label = typeof item.label === 'string' ? item.label.trim() : '';
    const month = typeof item.month === 'string' ? item.month : '';
    const type = item.type === 'income' ? 'income' : 'expense';
    const amount = Math.abs(toFiniteNumber(item.amount));

    if (!monthPattern.test(month) || amount === 0) {
      return [];
    }

    return [
      {
        amount,
        id,
        label: label.length > 0 ? label : 'Scenario event',
        month,
        type,
      },
    ];
  });
}

function toFiniteNumber(value: unknown): number {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : 0;
}

function createProjectionEventId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
