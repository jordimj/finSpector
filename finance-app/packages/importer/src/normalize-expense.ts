import { UNCATEGORIZED_CATEGORY, type NormalizedTransaction, type RawTransactionRow } from "@finance/shared";

export function normalizeTransaction(row: RawTransactionRow): NormalizedTransaction {
  const amount = normalizeAmount(row.amount);
  const type = normalizeType(row.type, amount);

  return {
    date: normalizeDate(row.date),
    amount: Math.abs(Number(amount)).toFixed(2),
    counterpartyName: normalizeCounterpartyName(row.description),
    description: normalizeOptionalText(row.description),
    categoryName: normalizeCategoryName(row.category),
    subcategoryName: normalizeOptionalText(row.subcategory),
    type,
    notes: normalizeOptionalText(row.notes)
  };
}

export function normalizeDate(value: string): string {
  const trimmed = value.trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed;
  }

  const slashDate = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashDate) {
    const day = slashDate[1] ?? "";
    const month = slashDate[2] ?? "";
    const year = slashDate[3] ?? "";
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid date: ${value}`);
  }

  return parsed.toISOString().slice(0, 10);
}

export function normalizeAmount(value: string): string {
  const stripped = value
    .replaceAll("\u00a0", "")
    .replace(/[^\d.,'-]/g, "")
    .replaceAll("'", "")
    .trim();
  const normalized = stripped.includes(",")
    ? stripped.replaceAll(".", "").replaceAll(",", ".")
    : stripped.replaceAll(",", "");
  const amount = Number(normalized);

  if (!Number.isFinite(amount)) {
    throw new Error(`Invalid amount: ${value}`);
  }

  return amount.toFixed(2);
}

export function normalizeCounterpartyName(value: string): string {
  return value
    .replace(/\s+/g, " ")
    .replace(/\b(card|payment|pos|debit|credit)\b/gi, "")
    .trim()
    .toUpperCase();
}

function normalizeCategoryName(value: string | undefined): string {
  const normalized = normalizeOptionalText(value);
  return normalized ?? UNCATEGORIZED_CATEGORY;
}

function normalizeType(value: string | undefined, amount: string): NormalizedTransaction["type"] {
  const normalized = value?.trim().toLowerCase();

  if (normalized === "expense" || normalized === "income") {
    return normalized;
  }

  return Number(amount) < 0 ? "expense" : "income";
}

function normalizeOptionalText(value: string | undefined): string | undefined {
  const normalized = value?.trim();
  return normalized && normalized.length > 0 ? normalized : undefined;
}
