import { BarcodeActivityPeriod as ActivityPeriod } from "@/service/dashboard/barcode-generator/type";
import BarcodeActivityDateSelect from "./BarcodeActivityDateSelect";

const PERIOD_OPTIONS: { label: string; value: ActivityPeriod }[] = [
  { label: "Year", value: "year" },
  { label: "Month", value: "month" },
  { label: "Week", value: "week" },
];

type BarcodeActivityPeriodProps = {
  period: ActivityPeriod;
  date: string;
  onPeriodChange: (period: ActivityPeriod) => void;
  onDateChange: (date: string) => void;
};

export default function BarcodeActivityPeriod({
  period,
  date,
  onPeriodChange,
  onDateChange,
}: BarcodeActivityPeriodProps) {
  return (
    <div className="flex min-w-0 flex-col gap-3 max-[540px]:gap-2 sm:items-end">
      <fieldset className="flex w-full rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-1 sm:w-auto">
        <legend className="sr-only">Activity period</legend>
        {PERIOD_OPTIONS.map((option) => (
          <label
            key={option.value}
            className="flex-1 cursor-pointer rounded-lg px-3 py-1.5 text-center text-xs font-medium text-[hsl(var(--muted-foreground))] has-[:checked]:bg-[hsl(var(--primary))] has-[:checked]:text-[hsl(var(--primary-foreground))] max-[540px]:px-2 max-[540px]:py-1 max-[540px]:text-[11px] sm:flex-none"
          >
            <input
              type="radio"
              name="activityPeriod"
              value={option.value}
              checked={period === option.value}
              onChange={() => onPeriodChange(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </fieldset>

      <BarcodeActivityDateSelect
        period={period}
        date={date}
        onDateChange={onDateChange}
      />
    </div>
  );
}
