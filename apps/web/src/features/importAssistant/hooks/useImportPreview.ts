import { useMutation } from '@tanstack/react-query';
import { apiBaseUrl } from '../../../lib/api';
import type { ImportPreviewResponse } from '../types';
import {
  contentTypeForFile,
  isSupportedImportFile,
  previewPathForFile,
} from '../utils/filePreview';

export function useImportPreview() {
  return useMutation({
    mutationFn: fetchImportPreview,
  });
}

async function fetchImportPreview(file: File): Promise<ImportPreviewResponse> {
  if (!isSupportedImportFile(file)) {
    throw new Error('Choose a PDF or Excel file first.');
  }

  const response = await fetch(`${apiBaseUrl}${previewPathForFile(file)}`, {
    body: file,
    headers: {
      Accept: 'application/json',
      'Content-Type': contentTypeForFile(file),
    },
    method: 'POST',
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as {
      message?: string;
    } | null;

    throw new Error(
      errorBody?.message ?? `Preview failed with ${response.status}`,
    );
  }

  return response.json() as Promise<ImportPreviewResponse>;
}
