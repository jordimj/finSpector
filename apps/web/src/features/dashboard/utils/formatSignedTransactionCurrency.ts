import { formatTransactionCurrency } from '../../../utils';

export function formatSignedTransactionCurrency(value: number): string {
  if (value === 0) {
    return formatTransactionCurrency(0);
  }

  const prefix = value > 0 ? '+' : '-';

  return `${prefix}${formatTransactionCurrency(Math.abs(value))}`;
}
