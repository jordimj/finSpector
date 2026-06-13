import { readFile } from "node:fs/promises";
import type { RawTransactionRow } from "@finance/shared";

const REQUIRED_HEADERS = ["date", "amount", "description"] as const;

export async function parseSampleCsv(filePath: string): Promise<RawTransactionRow[]> {
  // Replace this CSV reader with bank-specific Excel parsing once the first real export is available.
  // The goal is to keep all source-specific column mapping at this boundary.
  const csv = await readFile(filePath, "utf8");
  const rawLines = csv.trim().split(/\r?\n/);
  const headerIndex = rawLines.findIndex((line) => {
    const delimiter = detectDelimiter(line);
    const headers = splitCsvLine(line, delimiter);
    return REQUIRED_HEADERS.every((header) => headers.includes(header));
  });

  if (headerIndex === -1) {
    return [];
  }

  const headerLine = rawLines[headerIndex] ?? "";
  const lines = rawLines.slice(headerIndex + 1);
  const delimiter = detectDelimiter(headerLine);
  const headers = splitCsvLine(headerLine, delimiter);
  assertRequiredHeaders(headers);

  return lines
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      const values = splitCsvLine(line, delimiter);
      return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])) as RawTransactionRow;
    });
}

function assertRequiredHeaders(headers: string[]): void {
  const missingHeaders = REQUIRED_HEADERS.filter((header) => !headers.includes(header));

  if (missingHeaders.length > 0) {
    throw new Error(`Missing required CSV headers: ${missingHeaders.join(", ")}`);
  }
}

function detectDelimiter(line: string): "," | ";" {
  return line.includes(";") ? ";" : ",";
}

function splitCsvLine(line: string, delimiter: "," | ";"): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (const character of line) {
    if (character === "\"") {
      inQuotes = !inQuotes;
      continue;
    }

    if (character === delimiter && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += character;
  }

  values.push(current.trim());
  return values;
}
