"use client";

import type { SchemaAnalyticsPanel } from "./types";
import { toolSchema as brokenLinkCheckerSchema } from "./schemas/broken-link-checker.schema";
import { toolSchema as bulkBarcodeSchema } from "./schemas/bulk-barcode-generator.schema";
import { toolSchema as linkExpanderSchema } from "./schemas/link-expander.schema";
import { toolSchema as onetimeLinkSchema } from "./schemas/onetime-link.schema";
import { toolSchema as urlShortenerSchema } from "./schemas/url-shortener.schema";

const analyticsBySlug: Record<string, SchemaAnalyticsPanel> = {
  "url-shortener": urlShortenerSchema.panels.analytics,
  "link-expander": linkExpanderSchema.panels.analytics,
  "broken-link-checker": brokenLinkCheckerSchema.panels.analytics,
  "onetime-link": onetimeLinkSchema.panels.analytics,
  "bulk-barcode-generator": bulkBarcodeSchema.panels.analytics,
  "barcode-generator": bulkBarcodeSchema.panels.analytics,
};

export function getClientAnalyticsSchema(
  slug: string,
): SchemaAnalyticsPanel | null {
  return analyticsBySlug[slug] ?? null;
}
