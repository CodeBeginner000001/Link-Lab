import ToolFeaturePill from "../component/ToolFeaturePill";
import { BarChart3 } from "lucide-react";
import BarcodeRecentRowSlot from "./custom-slots/barcode-generator/BarcodeRecentRowSlot";
import BarcodeGeneratorPreviewSlot from "./custom-slots/barcode-generator/BarcodeGeneratorPreviewSlot";
import RecentBarcodesHeader from "./custom-slots/barcode-generator/RecentBarcodesHeader";
import OneTimeLinkDataSlot from "./custom-slots/onetime-link/OneTimeLinkDataSlot";
import OneTimeLinkGeneratedLinkSlot from "./custom-slots/onetime-link/OneTimeLinkGeneratedLinkSlot";
import URLShortenerLinksDataSlot from "./custom-slots/url-shortener/URLShortenerLinksDataSlot";
import URLShortenerGeneratedLinksSlot from "./custom-slots/url-shortener/URLShortenerGeneratedLinksSlot";
import type { AnyFeatureToolSchema, FeaturePanelSlots } from "./types";

export function getFeaturePanelSlots(
  schema: AnyFeatureToolSchema,
  items: Record<string, unknown>[] = [],
): FeaturePanelSlots<Record<string, unknown>> {
  const { slug } = schema;
  const deleteAction = schema.panels.data.deleteAction;

  if (slug === "url-shortener") {
    return {
      secondary: <URLShortenerGeneratedLinksSlot items={items} />,
      dataPanelDescription: items.length
        ? `${items.length} generated link${items.length > 1 ? "s" : ""}.`
        : "Recent short links will appear here after you create them.",
      dataPanelHeader: items.length ? (
        <ToolFeaturePill icon={BarChart3} label={`${items.length} total`} />
      ) : undefined,
      dataContent: (
        <URLShortenerLinksDataSlot items={items} deleteAction={deleteAction} />
      ),
    };
  }

  if (slug === "onetime-link") {
    return {
      secondary: <OneTimeLinkGeneratedLinkSlot items={items} />,
      dataPanelDescription: items.length
        ? `${items.length} one-time link${items.length > 1 ? "s" : ""}.`
        : "Recent one-time links will appear here after you create them.",
      dataPanelHeader: items.length ? (
        <ToolFeaturePill icon={BarChart3} label={`${items.length} total`} />
      ) : undefined,
      dataContent: (
        <OneTimeLinkDataSlot items={items} deleteAction={deleteAction} />
      ),
    };
  }

  if (slug === "barcode-generator") {
    return {
      secondary: (
        <BarcodeGeneratorPreviewSlot eventName="barcode-data-changed" />
      ),
      dataHeader: <RecentBarcodesHeader />,
      row: (item) => (
        <BarcodeRecentRowSlot barcode={item} deleteAction={deleteAction} />
      ),
    };
  }

  return {};
}
