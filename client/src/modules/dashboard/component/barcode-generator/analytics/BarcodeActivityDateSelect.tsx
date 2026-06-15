import { BarcodeActivityPeriod } from "@/service/dashboard/barcode-generator/type";
import {
  getIsoWeeksForMonth,
  getIsoWeekStart,
  getYearOptions,
  MONTH_OPTIONS,
} from "./barcode-activity-options";

type BarcodeActivityDateSelectProps = {
  period: BarcodeActivityPeriod;
  date: string;
  onDateChange: (date: string) => void;
};

const selectClassName =
  "h-9 min-w-0 shrink-0 rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-2 text-xs text-[hsl(var(--foreground))] outline-none focus:ring-2 focus:ring-[hsl(var(--ring)/0.22)] max-[540px]:h-8 max-[540px]:text-[11px]";

function padMonth(month: number): string {
  return String(month).padStart(2, "0");
}

export default function BarcodeActivityDateSelect({
  period,
  date,
  onDateChange,
}: BarcodeActivityDateSelectProps) {
  if (period === "year") {
    const selectedYear = Number(date);

    return (
      <label className="flex self-end items-center gap-2 text-xs text-[hsl(var(--muted-foreground))] max-[400px]:w-full">
        <span className="shrink-0">Selected year</span>
        <select
          name="activityYear"
          value={selectedYear}
          onChange={(event) => onDateChange(event.target.value)}
          className={`${selectClassName} w-24 max-[540px]:w-20 max-[400px]:flex-1`}
        >
          {getYearOptions(selectedYear).map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (period === "month") {
    const [yearValue, monthValue] = date.split("-");
    const selectedYear = Number(yearValue);
    const selectedMonth = Number(monthValue);

    return (
      <div className="flex w-full flex-nowrap items-center gap-2 overflow-x-auto pb-1 text-xs text-[hsl(var(--muted-foreground))] max-[400px]:grid max-[400px]:grid-cols-2 max-[400px]:overflow-visible sm:w-max sm:max-w-full sm:justify-end sm:pb-0">
        <span className="shrink-0 max-[400px]:col-span-2">Selected month</span>
        <select
          name="activityMonthYear"
          aria-label="Activity year"
          value={selectedYear}
          onChange={(event) =>
            onDateChange(`${event.target.value}-${padMonth(selectedMonth)}`)
          }
          className={`${selectClassName} w-24 max-[540px]:w-20 max-[400px]:w-full`}
        >
          {getYearOptions(selectedYear).map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
        <select
          name="activityMonth"
          aria-label="Activity month"
          value={selectedMonth}
          onChange={(event) =>
            onDateChange(
              `${selectedYear}-${padMonth(Number(event.target.value))}`,
            )
          }
          className={`${selectClassName} w-32 max-[540px]:w-24 max-[400px]:w-full`}
        >
          {MONTH_OPTIONS.map((month) => (
            <option key={month.value} value={month.value}>
              {month.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  const weekStart = getIsoWeekStart(date);
  const weekThursday = new Date(weekStart);
  weekThursday.setUTCDate(weekStart.getUTCDate() + 3);
  const selectedYear = Number(date.slice(0, 4));
  const selectedMonth = weekThursday.getUTCMonth() + 1;
  const weekOptions = getIsoWeeksForMonth(selectedYear, selectedMonth);

  const selectFirstWeek = (year: number, month: number) => {
    const firstWeek = getIsoWeeksForMonth(year, month)[0];

    if (firstWeek) {
      onDateChange(firstWeek.value);
    }
  };

  return (
    <div className="flex w-full flex-nowrap items-center gap-2 overflow-x-auto pb-1 text-xs text-[hsl(var(--muted-foreground))] max-[400px]:grid max-[400px]:grid-cols-2 max-[400px]:overflow-visible sm:w-max sm:max-w-full sm:justify-end sm:pb-0">
      <span className="shrink-0 max-[400px]:col-span-2">Selected week</span>
      <select
        name="activityWeekYear"
        aria-label="Week year"
        value={selectedYear}
        onChange={(event) =>
          selectFirstWeek(Number(event.target.value), selectedMonth)
        }
        className={`${selectClassName} w-24 max-[540px]:w-20 max-[400px]:w-full`}
      >
        {getYearOptions(selectedYear).map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
      <select
        name="activityWeekMonth"
        aria-label="Week month"
        value={selectedMonth}
        onChange={(event) =>
          selectFirstWeek(selectedYear, Number(event.target.value))
        }
        className={`${selectClassName} w-32 max-[540px]:w-24 max-[400px]:w-full`}
      >
        {MONTH_OPTIONS.map((month) => (
          <option key={month.value} value={month.value}>
            {month.label}
          </option>
        ))}
      </select>
      <select
        name="activityWeek"
        aria-label="Activity week"
        value={date}
        onChange={(event) => onDateChange(event.target.value)}
        className={`${selectClassName} w-56 max-[540px]:w-44 max-[400px]:col-span-2 max-[400px]:w-full`}
      >
        {weekOptions.map((week) => (
          <option key={week.value} value={week.value}>
            {week.label}
          </option>
        ))}
      </select>
    </div>
  );
}
