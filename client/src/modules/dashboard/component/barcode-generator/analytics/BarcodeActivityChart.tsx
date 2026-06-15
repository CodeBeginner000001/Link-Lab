import {
  BarcodeActivity,
  BarcodeActivityPeriod as ActivityPeriod,
} from "@/service/dashboard/barcode-generator/type";
import { Loader2 } from "lucide-react";
import BarcodeActivityPeriod from "./BarcodeActivityPeriod";

type BarcodeActivityChartProps = {
  activity: BarcodeActivity | null;
  period: ActivityPeriod;
  date: string;
  loading: boolean;
  onPeriodChange: (period: ActivityPeriod) => void;
  onDateChange: (date: string) => void;
};

const PERIOD_LABELS: Record<ActivityPeriod, string> = {
  week: "Weekly",
  month: "Monthly",
  year: "Yearly",
};

function formatPointLabel(label: string, period: ActivityPeriod): string {
  if (period === "year") {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      timeZone: "UTC",
    }).format(new Date(`${label}-01T00:00:00.000Z`));
  }

  if (period === "month") {
    return String(Number(label.slice(-2)));
  }

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    timeZone: "UTC",
  }).format(new Date(`${label}T00:00:00.000Z`));
}

function shouldShowPointLabel(
  index: number,
  pointCount: number,
  period: ActivityPeriod,
): boolean {
  if (period !== "month") {
    return true;
  }

  const day = index + 1;
  return day === 1 || day % 5 === 0 || day === pointCount;
}

export default function BarcodeActivityChart({
  activity,
  period,
  date,
  loading,
  onPeriodChange,
  onDateChange,
}: BarcodeActivityChartProps) {
  const selectedActivity =
    activity?.period === period && activity.selectedDate === date
      ? activity
      : null;
  const points = selectedActivity?.points ?? [];
  const maxCount = Math.max(...points.map((point) => point.count), 1);
  const growth = selectedActivity?.growth ?? 0;

  return (
    <div
      className="relative rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.18)] p-4 sm:p-5"
      aria-busy={loading}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold">
            {PERIOD_LABELS[period]} activity
          </p>
          <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
            Barcodes generated in the selected {period}
          </p>
          <p
            className={`mt-2 text-sm font-semibold ${
              growth < 0
                ? "text-rose-600 dark:text-rose-400"
                : "text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {growth > 0 ? "+" : ""}
            {growth}%
          </p>
        </div>
        <BarcodeActivityPeriod
          period={period}
          date={date}
          onPeriodChange={onPeriodChange}
          onDateChange={onDateChange}
        />
      </div>

      <div
        className={`mt-6 flex h-44 items-end gap-1.5 transition-opacity sm:gap-3 ${
          loading ? "opacity-45" : "opacity-100"
        }`}
      >
        {points.map((point, index) => (
          <div
            key={point.label}
            className="flex h-full min-w-0 flex-1 flex-col justify-end gap-2"
            title={`${point.label}: ${point.count}`}
          >
            <div
              className="min-h-1 w-full rounded-t-lg bg-gradient-to-t from-[hsl(var(--primary))] to-cyan-300"
              style={{ height: `${(point.count / maxCount) * 100}%` }}
            />
            <span className="truncate text-center text-[9px] font-medium text-[hsl(var(--muted-foreground))] sm:text-[10px]">
              {shouldShowPointLabel(index, points.length, period)
                ? formatPointLabel(point.label, period)
                : "\u00a0"}
            </span>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="pointer-events-none absolute inset-x-0 bottom-5 flex h-44 items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-[hsl(var(--primary))]" />
        </div>
      ) : null}
    </div>
  );
}
