"use client";

import {
  BARCODE_DATA_CHANGED_EVENT,
  GetBarcodeActivity,
  GetBarcodeAnalyticsSummary,
} from "@/service/dashboard/barcode-generator";
import {
  BarcodeActivity,
  BarcodeActivityPeriod,
  BarcodeAnalyticsSummary,
} from "@/service/dashboard/barcode-generator/type";
import { BarChart3 } from "lucide-react";
import { useEffect, useState } from "react";
import ToolFeaturePill from "../common/ToolFeaturePill";
import ToolPanel from "../common/ToolPanel";
import BarcodeActivityChart from "./analytics/BarcodeActivityChart";
import BarcodeFormatAnalytics from "./analytics/BarcodeFormatAnalytics";
import BarcodeSummaryMetrics from "./analytics/BarcodeSummaryMetrics";

type ActivityDates = Record<BarcodeActivityPeriod, string>;

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

export default function BarcodeAnalyticsPanel() {
  const [summary, setSummary] = useState<BarcodeAnalyticsSummary | null>(null);
  const [activity, setActivity] = useState<BarcodeActivity | null>(null);
  const [period, setPeriod] = useState<BarcodeActivityPeriod>("week");
  const [activityDates, setActivityDates] = useState<ActivityDates>(
    getInitialActivityDates,
  );
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [activityLoading, setActivityLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const refreshAnalytics = () => {
      setRefreshKey((currentKey) => currentKey + 1);
    };

    window.addEventListener(BARCODE_DATA_CHANGED_EVENT, refreshAnalytics);

    return () => {
      window.removeEventListener(BARCODE_DATA_CHANGED_EVENT, refreshAnalytics);
    };
  }, []);

  useEffect(() => {
    let active = true;

    const loadSummary = async () => {
      const response = await GetBarcodeAnalyticsSummary();

      if (active && "result" in response) {
        setSummary(response.result.data);
      }

      if (active) {
        setSummaryLoading(false);
      }
    };

    void loadSummary();

    return () => {
      active = false;
    };
  }, [refreshKey]);

  useEffect(() => {
    let active = true;

    const loadActivity = async () => {
      setActivityLoading(true);
      const response = await GetBarcodeActivity(period, activityDates[period]);

      if (active && "result" in response) {
        setActivity(response.result.data);
      }

      if (active) {
        setActivityLoading(false);
      }
    };

    void loadActivity();

    return () => {
      active = false;
    };
  }, [activityDates, period, refreshKey]);

  const handleDateChange = (date: string) => {
    if (!date) {
      return;
    }

    setActivityDates((currentDates) => ({
      ...currentDates,
      [period]: date,
    }));
  };

  const selectedActivity =
    activity?.period === period &&
    activity.selectedDate === activityDates[period]
      ? activity
      : null;

  return (
    <ToolPanel
      heading="Barcode Analytics"
      para="Generation volume, downloads, growth, and format usage."
      headerSlot={
        <ToolFeaturePill
          icon={BarChart3}
          label="Live analytics"
          className="max-[540px]:gap-1.5 max-[540px]:px-2.5 max-[540px]:py-1 max-[540px]:text-[10px] max-[540px]:[&_svg]:h-3 max-[540px]:[&_svg]:w-3"
        />
      }
      className="max-[540px]:rounded-xl max-[540px]:p-3"
      headerClassName="max-[540px]:gap-3 max-[540px]:pb-3 max-[540px]:[&_h2]:text-lg max-[540px]:[&_p]:text-xs max-[540px]:[&_p]:leading-snug"
      bodyClassName="max-[540px]:pt-3"
    >
      <div className="grid gap-5 max-[540px]:gap-3 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
        <div className="space-y-5 max-[540px]:space-y-3">
          <BarcodeSummaryMetrics
            summary={summary}
            growth={selectedActivity?.growth ?? null}
            summaryLoading={summaryLoading}
            growthLoading={activityLoading}
          />
          <BarcodeActivityChart
            activity={activity}
            period={period}
            date={activityDates[period]}
            loading={activityLoading}
            onPeriodChange={setPeriod}
            onDateChange={handleDateChange}
          />
        </div>

        <BarcodeFormatAnalytics summary={summary} />
      </div>
    </ToolPanel>
  );
}
