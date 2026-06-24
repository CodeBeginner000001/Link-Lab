"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { SchemaActivityPeriod, SchemaAnalyticsActivitySection, SchemaApiEndpoint } from ".";
import {
  getIsoWeeksForMonth,
  getIsoWeekStart,
  getYearOptions,
  MONTH_OPTIONS,
} from "../schema-driven/schema-activity-options";
import { getValueByPath } from "../schema-driven/utils";

type ActivityPoint = {
  label: string;
  count: number;
};

type ActivityData = {
  period: SchemaActivityPeriod;
  selectedDate: string;
  growth: number;
  points: ActivityPoint[];
};

type ActivityDates = Record<SchemaActivityPeriod, string>;

type SchemaActivitySectionProps = {
  section: SchemaAnalyticsActivitySection;
};

const PERIOD_OPTIONS: { label: string; value: SchemaActivityPeriod }[] = [
  { label: "Year", value: "year" },
  { label: "Month", value: "month" },
  { label: "Week", value: "week" },
];

const PERIOD_LABELS: Record<SchemaActivityPeriod, string> = {
  week: "Weekly",
  month: "Monthly",
  year: "Yearly",
};

const REFRESH_INTERVAL_MS = 10_000;

const selectClassName =
  "h-9 min-w-0 shrink-0 rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-2 text-base text-[hsl(var(--foreground))] outline-none focus:ring-2 focus:ring-[hsl(var(--ring)/0.22)] sm:text-xs max-[540px]:h-8";

function getCurrentWeek(date: Date): string {
  const target = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  const day = target.getUTCDay() || 7;
  target.setUTCDate(target.getUTCDate() + 4 - day);
  const weekYear = target.getUTCFullYear();
  const yearStart = new Date(Date.UTC(weekYear, 0, 1));
  const week = Math.ceil(
    ((target.getTime() - yearStart.getTime()) / 86400000 + 1) / 7,
  );

  return `${weekYear}-W${String(week).padStart(2, "0")}`;
}

function getInitialActivityDates(): ActivityDates {
  const now = new Date();
  const year = String(now.getFullYear());
  const month = `${year}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  return {
    year,
    month,
    week: getCurrentWeek(now),
  };
}

function getEndpointUrl(endpoint: SchemaApiEndpoint) {
  if (endpoint.path.startsWith("http") || endpoint.useProxy === false) {
    return endpoint.path;
  }

  return endpoint.path.startsWith("/api/")
    ? endpoint.path
    : `/api/features${endpoint.path}`;
}

function buildActivityUrl(
  endpoint: SchemaApiEndpoint,
  period: SchemaActivityPeriod,
  date: string,
) {
  const url = getEndpointUrl(endpoint);
  if (url.includes(":period") || url.includes(":date")) {
    return url
      .replace(":period", encodeURIComponent(period))
      .replace(":date", encodeURIComponent(date));
  }

  const [pathname, search = ""] = url.split("?");
  const params = new URLSearchParams(search);
  params.set("period", period);
  params.set("date", date);

  return `${pathname}?${params.toString()}`;
}

function mapActivityData(
  raw: unknown,
  section: SchemaAnalyticsActivitySection,
): ActivityData | null {
  const value = section.api.responsePath
    ? getValueByPath(raw, section.api.responsePath)
    : raw;

  if (!value || typeof value !== "object") {
    return null;
  }

  const source = value as Record<string, unknown>;
  const pointsValue = getValueByPath(source, section.pointsPath ?? "points");
  const points = Array.isArray(pointsValue)
    ? pointsValue.map((point) => ({
        label: String(
          getValueByPath(point, section.pointLabelPath ?? "label") ?? "",
        ),
        count: Number(
          getValueByPath(point, section.pointValuePath ?? "count") ?? 0,
        ),
      }))
    : [];

  return {
    period: String(
      getValueByPath(source, section.periodPath ?? "period") ?? "week",
    ) as SchemaActivityPeriod,
    selectedDate: String(
      getValueByPath(source, section.selectedDatePath ?? "selectedDate") ?? "",
    ),
    growth: Number(getValueByPath(source, section.growthPath ?? "growth") ?? 0),
    points,
  };
}

function formatPointLabel(label: string, period: SchemaActivityPeriod): string {
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
  period: SchemaActivityPeriod,
): boolean {
  if (period !== "month") {
    return true;
  }

  const day = index + 1;
  return day === 1 || day % 5 === 0 || day === pointCount;
}

function padMonth(month: number): string {
  return String(month).padStart(2, "0");
}

export default function SchemaActivitySection({
  section,
}: SchemaActivitySectionProps) {
  const [period, setPeriod] = useState<SchemaActivityPeriod>(
    section.defaultPeriod ?? "week",
  );
  const [activityDates, setActivityDates] = useState<ActivityDates>(
    getInitialActivityDates,
  );
  const [activity, setActivity] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const selectedDate = activityDates[period];

  useEffect(() => {
    const refreshEvent = section.refreshEvent;

    if (!refreshEvent) {
      return;
    }

    const refresh = () => setRefreshKey((currentKey) => currentKey + 1);
    window.addEventListener(refreshEvent, refresh);

    return () => {
      window.removeEventListener(refreshEvent, refresh);
    };
  }, [section.refreshEvent]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setRefreshKey((currentKey) => currentKey + 1);
    }, REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadActivity = async () => {
      setLoading(true);

      try {
        const response = await fetch(
          buildActivityUrl(section.api, period, selectedDate),
          { method: section.api.method ?? "GET", cache: "no-store" },
        );
        const json = await response.json().catch(() => null);

        if (active && response.ok) {
          setActivity(mapActivityData(json, section));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadActivity();

    return () => {
      active = false;
    };
  }, [period, refreshKey, section, selectedDate]);

  const selectedActivity =
    activity?.period === period && activity.selectedDate === selectedDate
      ? activity
      : null;
  const points = selectedActivity?.points ?? [];
  const maxCount = Math.max(...points.map((point) => point.count), 1);
  const growth = selectedActivity?.growth ?? 0;
  const title =
    section.titleByPeriod?.[period] ?? `${PERIOD_LABELS[period]} activity`;
  const description =
    section.descriptionTemplate?.replace("{period}", period) ??
    `Activity in the selected ${period}`;

  const handleDateChange = (date: string) => {
    if (!date) {
      return;
    }

    setActivityDates((currentDates) => ({
      ...currentDates,
      [period]: date,
    }));
  };

  return (
    <div
      className="relative min-w-0 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.18)] p-4 max-[400px]:!p-2.5 max-[540px]:rounded-xl max-[540px]:p-3 sm:p-5"
      aria-busy={loading}
    >
      <div className="flex min-w-0 flex-col gap-4 max-[540px]:gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold max-[540px]:text-xs">{title}</p>
          <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))] max-[540px]:text-[11px]">
            {description}
          </p>
          <p
            className={`mt-2 text-sm font-semibold max-[540px]:mt-1 max-[540px]:text-xs ${
              growth < 0
                ? "text-rose-600 dark:text-rose-400"
                : "text-emerald-600 dark:text-emerald-400"
            }`}
          >
            {growth > 0 ? "+" : ""}
            {growth}%
          </p>
        </div>
        <ActivityControls
          period={period}
          date={selectedDate}
          onPeriodChange={setPeriod}
          onDateChange={handleDateChange}
        />
      </div>

      <div
        className={`mt-6 flex h-44 min-w-0 items-end gap-1.5 transition-opacity max-[400px]:!h-32 max-[400px]:gap-1 max-[540px]:mt-4 max-[540px]:h-36 sm:gap-3 ${
          loading ? "opacity-45" : "opacity-100"
        }`}
      >
        {points.map((point, index) => (
          <div
            key={`${point.label}-${index}`}
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

function ActivityControls({
  period,
  date,
  onPeriodChange,
  onDateChange,
}: {
  period: SchemaActivityPeriod;
  date: string;
  onPeriodChange: (period: SchemaActivityPeriod) => void;
  onDateChange: (date: string) => void;
}) {
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
              name="schemaActivityPeriod"
              value={option.value}
              checked={period === option.value}
              onChange={() => onPeriodChange(option.value)}
              className="sr-only"
            />
            {option.label}
          </label>
        ))}
      </fieldset>

      <ActivityDateSelect
        period={period}
        date={date}
        onDateChange={onDateChange}
      />
    </div>
  );
}

function ActivityDateSelect({
  period,
  date,
  onDateChange,
}: {
  period: SchemaActivityPeriod;
  date: string;
  onDateChange: (date: string) => void;
}) {
  const fallbackDates = useMemo(() => getInitialActivityDates(), []);
  const safeDate = date || fallbackDates[period];

  if (period === "year") {
    const selectedYear = Number(safeDate);

    return (
      <label className="flex items-center gap-2 self-end text-xs text-[hsl(var(--muted-foreground))] max-[400px]:w-full">
        <span className="shrink-0">Selected year</span>
        <select
          name="schemaActivityYear"
          value={selectedYear}
          onChange={(event) => onDateChange(event.target.value)}
          className={`${selectClassName} w-24 max-[400px]:flex-1 max-[540px]:w-20`}
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
    const [yearValue, monthValue] = safeDate.split("-");
    const selectedYear = Number(yearValue);
    const selectedMonth = Number(monthValue);

    return (
      <div className="grid w-full grid-cols-2 items-center gap-2 text-xs text-[hsl(var(--muted-foreground))] md:flex md:w-max md:max-w-full md:flex-nowrap md:justify-end md:overflow-x-auto md:pb-1">
        <span className="col-span-2 shrink-0 md:col-auto">Selected month</span>
        <select
          name="schemaActivityMonthYear"
          aria-label="Activity year"
          value={selectedYear}
          onChange={(event) =>
            onDateChange(`${event.target.value}-${padMonth(selectedMonth)}`)
          }
          className={`${selectClassName} w-full md:w-24`}
        >
          {getYearOptions(selectedYear).map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ))}
        </select>
        <select
          name="schemaActivityMonth"
          aria-label="Activity month"
          value={selectedMonth}
          onChange={(event) =>
            onDateChange(
              `${selectedYear}-${padMonth(Number(event.target.value))}`,
            )
          }
          className={`${selectClassName} w-full md:w-32`}
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

  const weekStart = getIsoWeekStart(safeDate);
  const weekThursday = new Date(weekStart);
  weekThursday.setUTCDate(weekStart.getUTCDate() + 3);
  const selectedYear = Number(safeDate.slice(0, 4));
  const selectedMonth = weekThursday.getUTCMonth() + 1;
  const weekOptions = getIsoWeeksForMonth(selectedYear, selectedMonth);

  const selectFirstWeek = (year: number, month: number) => {
    const firstWeek = getIsoWeeksForMonth(year, month)[0];

    if (firstWeek) {
      onDateChange(firstWeek.value);
    }
  };

  return (
    <div className="grid w-full grid-cols-2 items-center gap-2 text-xs text-[hsl(var(--muted-foreground))] md:flex md:w-max md:max-w-full md:flex-nowrap md:justify-end md:overflow-x-auto md:pb-1">
      <span className="col-span-2 shrink-0 md:col-auto">Selected week</span>
      <select
        name="schemaActivityWeekYear"
        aria-label="Week year"
        value={selectedYear}
        onChange={(event) =>
          selectFirstWeek(Number(event.target.value), selectedMonth)
        }
        className={`${selectClassName} w-full md:w-24`}
      >
        {getYearOptions(selectedYear).map((year) => (
          <option key={year} value={year}>
            {year}
          </option>
        ))}
      </select>
      <select
        name="schemaActivityWeekMonth"
        aria-label="Week month"
        value={selectedMonth}
        onChange={(event) =>
          selectFirstWeek(selectedYear, Number(event.target.value))
        }
        className={`${selectClassName} w-full md:w-32`}
      >
        {MONTH_OPTIONS.map((month) => (
          <option key={month.value} value={month.value}>
            {month.label}
          </option>
        ))}
      </select>
      <select
        name="schemaActivityWeek"
        aria-label="Activity week"
        value={safeDate}
        onChange={(event) => onDateChange(event.target.value)}
        className={`${selectClassName} col-span-2 w-full md:col-auto md:w-56`}
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
