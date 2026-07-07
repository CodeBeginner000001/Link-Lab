"use client";

import { useEffect, useMemo, useState } from "react";

import { getClientAnalyticsSchema } from "../schema-driven/client-analytics-schema";
import { fetchMergedAnalyticsClient } from "../schema-driven/schema-endpoint-client";
import type { SchemaApiEndpoint } from "../schema-driven/types";
import SchemaAnalyticsPanel from "./SchemaAnalyticsPanel";

const REFRESH_INTERVAL_MS = 10_000;

type SchemaAnalyticsPollerProps = {
  slug: string;
  initialData?: Record<string, unknown>;
  mainApi?: SchemaApiEndpoint;
  distributionApis?: SchemaApiEndpoint[];
  activitySlot?: React.ReactNode;
  refreshEvents?: string[];
};

export default function SchemaAnalyticsPoller({
  slug,
  initialData,
  mainApi,
  distributionApis = [],
  activitySlot,
  refreshEvents = [],
}: SchemaAnalyticsPollerProps) {
  const schema = useMemo(() => getClientAnalyticsSchema(slug), [slug]);
  const [analytics, setAnalytics] = useState(initialData);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setAnalytics(initialData);
  }, [initialData]);

  useEffect(() => {
    const refresh = () => setRefreshKey((currentKey) => currentKey + 1);

    refreshEvents.forEach((event) => {
      window.addEventListener(event, refresh);
    });

    return () => {
      refreshEvents.forEach((event) => {
        window.removeEventListener(event, refresh);
      });
    };
  }, [refreshEvents]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        setRefreshKey((currentKey) => currentKey + 1);
      }
    }, REFRESH_INTERVAL_MS);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  useEffect(() => {
    if (refreshKey === 0) {
      return;
    }

    let active = true;

    const loadAnalytics = async () => {
      const merged = await fetchMergedAnalyticsClient(
        mainApi,
        distributionApis,
      );

      if (active && merged) {
        setAnalytics(merged);
      }
    };

    void loadAnalytics();

    return () => {
      active = false;
    };
  }, [refreshKey, mainApi, distributionApis]);

  if (!schema) {
    return null;
  }

  return (
    <SchemaAnalyticsPanel
      schema={schema}
      data={analytics}
      activitySlot={activitySlot}
    />
  );
}
