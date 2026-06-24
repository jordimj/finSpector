export function toMoneyText(value: number): string {
  const rounded = Math.round((value + Number.EPSILON) * 100) / 100;

  if (Object.is(rounded, -0) || rounded === 0) {
    return '0.00';
  }

  return rounded.toFixed(2);
}

export function toPositiveMoneyText(
  value: string | number | undefined,
  options: { allowZero?: boolean } = {},
): string | null {
  const numberValue = Number(value);

  if (
    !Number.isFinite(numberValue) ||
    numberValue < 0 ||
    (!options.allowZero && numberValue === 0)
  ) {
    return null;
  }

  return toMoneyText(numberValue);
}
