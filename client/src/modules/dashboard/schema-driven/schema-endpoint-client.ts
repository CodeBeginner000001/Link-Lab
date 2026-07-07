import type { SchemaApiEndpoint } from "./types";
import { getValueByPath } from "./utils";

export function getClientEndpointUrl(endpoint: SchemaApiEndpoint) {
  if (endpoint.path.startsWith("http") || endpoint.useProxy === false) {
    return endpoint.path;
  }

  return endpoint.path.startsWith("/api/")
    ? endpoint.path
    : `/api/features${endpoint.path}`;
}

function toRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : undefined;
}

export async function fetchSchemaEndpointClient(
  endpoint: SchemaApiEndpoint | undefined,
) {
  if (!endpoint || (endpoint.method && endpoint.method !== "GET")) {
    return undefined;
  }

  try {
    const response = await fetch(getClientEndpointUrl(endpoint), {
      method: "GET",
      cache: "no-store",
    });

    if (!response.ok) {
      return undefined;
    }

    const json = await response.json();

    return endpoint.responsePath
      ? getValueByPath(json, endpoint.responsePath)
      : json;
  } catch {
    return undefined;
  }
}

export async function fetchMergedAnalyticsClient(
  mainApi: SchemaApiEndpoint | undefined,
  distributionApis: SchemaApiEndpoint[],
) {
  const [analytics, ...distributionResults] = await Promise.all([
    fetchSchemaEndpointClient(mainApi),
    ...distributionApis.map((api) => fetchSchemaEndpointClient(api)),
  ]);

  const analyticsRecord = toRecord(analytics);
  const distributionRecords = distributionResults.map(toRecord);
  const mergedAnalytics = Object.assign(
    {},
    analyticsRecord,
    ...distributionRecords,
  );

  return Object.keys(mergedAnalytics).length > 0 ? mergedAnalytics : undefined;
}
