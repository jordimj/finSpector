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

export type ProjectionCustomExpenseExclusion = {
  categoryId: number;
  categoryName: string;
  id: string;
  subcategoryId?: number;
  subcategoryName?: string;
};

export type ProjectionSettings = {
  activeExpenseExclusionKeys: string[];
  customExpenseExclusions: ProjectionCustomExpenseExclusion[];
  oneOffEvents: ProjectionScenarioEvent[];
};

const storageKey = 'finance.projection.settings.v1';
const monthPattern = /^\d{4}-\d{2}$/;
const validExclusionKeys: ReadonlySet<string> = new Set(
  projectionDefaultExpenseExclusionKeys,
);

export const projectionDefaultSettings: ProjectionSettings = {
  activeExpenseExclusionKeys: [...projectionDefaultExpenseExclusionKeys],
  customExpenseExclusions: [],
  oneOffEvents: [],
};

export function createProjectionExpenseExclusionId(
  categoryId: number,
  subcategoryId?: number,
): string {
  return subcategoryId === undefined
    ? `category:${categoryId}`
    : `subcategory:${subcategoryId}`;
}

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
    customExpenseExclusions: normalizeCustomExpenseExclusions(
      value.customExpenseExclusions,
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

function normalizeCustomExpenseExclusions(
  value: unknown,
): ProjectionCustomExpenseExclusion[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const seenIds = new Set<string>();

  return value.flatMap((item) => {
    if (!isRecord(item)) {
      return [];
    }

    const categoryId = toPositiveInteger(item.categoryId);
    const subcategoryId = toPositiveInteger(item.subcategoryId);
    const categoryName = toTrimmedText(item.categoryName);
    const subcategoryName = toTrimmedText(item.subcategoryName);

    if (categoryId === null || categoryName.length === 0) {
      return [];
    }

    const id = createProjectionExpenseExclusionId(
      categoryId,
      subcategoryId ?? undefined,
    );

    if (seenIds.has(id)) {
      return [];
    }

    seenIds.add(id);

    return [
      {
        categoryId,
        categoryName,
        id,
        ...(subcategoryId === null
          ? {}
          : {
              subcategoryId,
              subcategoryName:
                subcategoryName.length > 0
                  ? subcategoryName
                  : `Subcategory ${subcategoryId}`,
            }),
      },
    ];
  });
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

function toPositiveInteger(value: unknown): number | null {
  const numberValue = Number(value);

  return Number.isInteger(numberValue) && numberValue > 0 ? numberValue : null;
}

function toTrimmedText(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
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
