export function parseCategoryId(value: string | null): number | undefined {
  if (value === null) {
    return undefined;
  }

  const parsedValue = Number(value);

  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    return undefined;
  }

  return parsedValue;
}
