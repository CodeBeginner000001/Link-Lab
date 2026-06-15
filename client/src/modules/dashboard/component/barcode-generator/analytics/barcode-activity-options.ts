export const MONTH_OPTIONS = Array.from({ length: 12 }, (_, index) => ({
  value: index + 1,
  label: new Intl.DateTimeFormat("en-US", {
    month: "long",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(2026, index, 1))),
}));

export function getYearOptions(selectedYear: number): number[] {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, index) => currentYear - index);

  return years.includes(selectedYear)
    ? years
    : [selectedYear, ...years].sort((a, b) => b - a);
}

function getFirstIsoWeekMonday(year: number): Date {
  const januaryFourth = new Date(Date.UTC(year, 0, 4));
  const day = januaryFourth.getUTCDay() || 7;
  januaryFourth.setUTCDate(januaryFourth.getUTCDate() - day + 1);
  return januaryFourth;
}

export function getIsoWeekStart(value: string): Date {
  const match = /^(\d{4})-W(\d{2})$/.exec(value);

  if (!match) {
    return getFirstIsoWeekMonday(new Date().getFullYear());
  }

  const start = getFirstIsoWeekMonday(Number(match[1]));
  start.setUTCDate(start.getUTCDate() + (Number(match[2]) - 1) * 7);
  return start;
}

export function getIsoWeeksForMonth(year: number, month: number) {
  const firstMonday = getFirstIsoWeekMonday(year);

  return Array.from({ length: 53 }, (_, index) => {
    const start = new Date(firstMonday);
    start.setUTCDate(firstMonday.getUTCDate() + index * 7);
    const thursday = new Date(start);
    thursday.setUTCDate(start.getUTCDate() + 3);
    const end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 6);

    return {
      value: `${year}-W${String(index + 1).padStart(2, "0")}`,
      start,
      end,
      thursday,
    };
  })
    .filter(
      ({ thursday }) =>
        thursday.getUTCFullYear() === year &&
        thursday.getUTCMonth() + 1 === month,
    )
    .map(({ value, start, end }) => ({
      value,
      label: `Week ${Number(value.slice(-2))} (${formatWeekDate(
        start,
      )} - ${formatWeekDate(end)})`,
    }));
}

function formatWeekDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}
