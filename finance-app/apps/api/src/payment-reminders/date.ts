export function daysInMonth(year: number, zeroBasedMonth: number): number {
  return new Date(year, zeroBasedMonth + 1, 0).getDate();
}

export function daysBetween(startDate: string, endDate: string): number {
  const start = parseDateKey(startDate).getTime();
  const end = parseDateKey(endDate).getTime();

  return Math.round((end - start) / 86_400_000);
}

export function monthDistance(startMonth: string, endMonth: string): number {
  const [startYear = 0, startMonthNumber = 1] = startMonth
    .split('-')
    .map(Number);
  const [endYear = 0, endMonthNumber = 1] = endMonth.split('-').map(Number);

  return (endYear - startYear) * 12 + (endMonthNumber - startMonthNumber);
}

export function addDays(date: string, dayCount: number): string {
  const parsedDate = parseDateKey(date);

  return formatDateKey(
    new Date(
      parsedDate.getFullYear(),
      parsedDate.getMonth(),
      parsedDate.getDate() + dayCount,
    ),
  );
}

export function parseDateKey(value: string): Date {
  const [year = 0, month = 1, day = 1] = value.split('-').map(Number);

  return new Date(year, month - 1, day);
}

export function formatDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}
