import { useRef, useState } from 'react';
import type {
  ImportReviewDraft,
} from '../types';
import {
  clearImportReviewDraft,
  loadImportReviewDraft,
  saveImportReviewDraft,
} from '../utils/draftStorage';

export function useImportReviewDraft() {
  const [initialDraft] = useState<ImportReviewDraft | null>(
    loadImportReviewDraft,
  );
  const [draftUpdatedAt, setDraftUpdatedAt] = useState<string | null>(
    initialDraft?.updatedAt ?? null,
  );
  const hasHydratedDraft = useRef(false);

  return {
    clearImportReviewDraft,
    draftUpdatedAt,
    hasHydratedDraft,
    initialDraft,
    saveImportReviewDraft,
    setDraftUpdatedAt,
  };
}
