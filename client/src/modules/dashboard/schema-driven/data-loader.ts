import { BACKEND_API_URL } from "@/utils/env";
import type {
  AnyFeatureToolSchema,
  SchemaApiEndpoint,
  SchemaPaginationState,
} from "./types";
import { getValueByPath } from "./utils";

type SchemaPageData = {
  items: Record<string, unknown>[];
  pagination?: SchemaPaginationState;
  analytics?: Record<string, unknown>;
};

function getEndpointUrl(endpoint: SchemaApiEndpoint) {
  if (endpoint.path.startsWith("http")) {
    return endpoint.path;
  }

  return `${BACKEND_API_URL}${endpoint.path}`;
}

function toRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : undefined;
}

async function fetchSchemaEndpoint(
  endpoint: SchemaApiEndpoint | undefined,
  headers?: HeadersInit,
  searchParams?: Record<string, string | number | undefined>,
) {
  if (!endpoint || endpoint.method && endpoint.method !== "GET") {
    return undefined;
  }

  try {
    const url = new URL(getEndpointUrl(endpoint));

    Object.entries(searchParams ?? {}).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    });

    const response = await fetch(url.toString(), {
      method: "GET",
      headers,
      next: { revalidate: 10, tags: endpoint.cacheTags },
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

function toPositiveInteger(value: unknown, fallback: number) {
  const numberValue = Number(value);

  return Number.isFinite(numberValue) && numberValue > 0
    ? Math.floor(numberValue)
    : fallback;
}

function getPaginationParams(
  schema: AnyFeatureToolSchema,
  searchParams?: Record<string, string | string[] | undefined>,
) {
  const pagination = schema.panels.data.pagination;

  if (!pagination?.enabled) {
    return undefined;
  }

  const pageParam = pagination.pageParam ?? "page";
  const limitParam = pagination.limitParam ?? "limit";
  const rawPage = searchParams?.[pageParam];
  const rawLimit = searchParams?.[limitParam];
  const page = toPositiveInteger(
    Array.isArray(rawPage) ? rawPage[0] : rawPage,
    1,
  );
  const limit = toPositiveInteger(
    Array.isArray(rawLimit) ? rawLimit[0] : rawLimit,
    pagination.pageSize ?? 10,
  );
  return {
    [pageParam]: page,
    [limitParam]: limit,
  };
}

export async function loadSchemaPageData(
  schema: AnyFeatureToolSchema,
  headers?: HeadersInit,
  searchParams?: Record<string, string | string[] | undefined>,
): Promise<SchemaPageData> {
  const dataPaginationParams = getPaginationParams(schema, searchParams);
  const distributionApis =
    schema.panels.analytics.sections
      ?.flatMap((section) =>
        section.type === "distribution" && section.api ? [section.api] : [],
      ) ?? [];
  const [items, analytics, ...distributionResults] = await Promise.all([
    fetchSchemaEndpoint(schema.panels.data.api, headers, dataPaginationParams),
    fetchSchemaEndpoint(schema.panels.analytics.api, headers),
    ...distributionApis.map((api) => fetchSchemaEndpoint(api, headers)),
  ]);
  const paginationConfig = schema.panels.data.pagination;
  const paginatedItems = paginationConfig?.enabled
    ? getValueByPath(items, paginationConfig.itemsPath ?? "items")
    : items;
  const pagination = paginationConfig?.enabled
    ? toRecord(
        getValueByPath(items, paginationConfig.paginationPath ?? "pagination"),
      )
    : undefined;

  const analyticsRecord = toRecord(analytics);
  const distributionRecords = distributionResults.map(toRecord);
  const mergedAnalytics = Object.assign(
    {},
    analyticsRecord,
    ...distributionRecords,
  );
  const hasAnalytics = Object.keys(mergedAnalytics).length > 0;

  return {
    items: Array.isArray(paginatedItems) ? paginatedItems : [],
    pagination: pagination
      ? {
          page: toPositiveInteger(pagination.page, 1),
          limit: toPositiveInteger(
            pagination.limit,
            paginationConfig?.pageSize ?? 10,
          ),
          total: Math.max(
            Number(pagination.total ?? pagination.totalItems ?? 0) || 0,
            0,
          ),
          totalPages: Math.max(Number(pagination.totalPages ?? 0) || 0, 0),
          hasMore: Boolean(pagination.hasMore),
        }
      : undefined,
    analytics: hasAnalytics
      ? schema.mapAnalytics
        ? schema.mapAnalytics(mergedAnalytics)
        : mergedAnalytics
      : undefined,
  };
}
