type MonthRange = {
  endMonth: string;
  startMonth: string;
};

export function formatMonthRange(range: MonthRange) {
  return `${formatProjectionMonth(range.startMonth)} - ${formatProjectionMonth(
    range.endMonth,
  )}`;
}

export function formatProjectionMonth(month: string) {
  const [year = 0, monthNumber = 1] = month.split('-').map(Number);

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    year: 'numeric',
  }).format(new Date(year, monthNumber - 1, 1));
}
