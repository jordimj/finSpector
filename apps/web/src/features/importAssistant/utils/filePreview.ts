export function previewPathForFile(file: File): string {
  return isSpreadsheetFile(file)
    ? '/api/imports/spreadsheet-preview'
    : '/api/imports/pdf-preview';
}

export function contentTypeForFile(file: File): string {
  if (!isSpreadsheetFile(file)) {
    return 'application/pdf';
  }

  return file.name.toLowerCase().endsWith('.xlsx') ||
    file.name.toLowerCase().endsWith('.xlsm')
    ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    : 'application/vnd.ms-excel';
}

export function isSpreadsheetFile(file: File): boolean {
  return /\.(xls|xlsx|xlsm)$/i.test(file.name);
}

export function isSupportedImportFile(file: File): boolean {
  return /\.(pdf|xls|xlsx|xlsm)$/i.test(file.name);
}
