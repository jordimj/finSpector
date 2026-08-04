export type ImportPreviewRow = {
  date: string;
  description: string;
  concept?: string;
  amount: string;
  type: 'expense' | 'income';
  rawText: string;
  suggestedDescription: string | null;
  suggestedCategory: string | null;
  suggestedSubcategory: string | null;
  confidence: number;
  matchedDescription: string | null;
  matchedAmount: string | null;
  matchedDate: string | null;
  matchReason: string;
  reviewed?: boolean;
  skipped?: boolean;
};

export type ImportReviewRow = ImportPreviewRow & {
  originalDescription: string;
  originalSuggestedCategory: string | null;
  originalSuggestedSubcategory: string | null;
  originalReviewKey: string;
};

export type ImportPreviewResponse = {
  extractedTextLength: number;
  rowCount: number;
  rows: ImportPreviewRow[];
  textPreview: string;
};

export type ExportCsvRow = {
  date: string;
  category: string | null;
  subcategory: string | null;
  description: string;
  amount: string;
  type: ImportPreviewRow['type'];
  bankConcept: string;
};

export type ExportCsvMode = 'all' | ImportPreviewRow['type'];

export type ApplyMatchingRowsScope = 'all' | 'filtered' | 'none';

export type ExportCsvPeriod =
  | {
      type: 'all';
    }
  | {
      type: 'month';
      month: string;
    };

export type ExportMonthOption = {
  label: string;
  month: string;
};

export type ImportReviewDraft = {
  version: number;
  sourceFileName: string;
  rows: ImportReviewRow[];
  exportCsvMode: ExportCsvMode;
  exportCsvPeriod: ExportCsvPeriod;
  updatedAt: string;
};
