import ToolFeaturePill from "../component/ToolFeaturePill";
import { BarChart3 } from "lucide-react";
import BarcodeRecentRowSlot from "./custom-slots/barcode-generator/BarcodeRecentRowSlot";
import BarcodeGeneratorPreviewSlot from "./custom-slots/barcode-generator/BarcodeGeneratorPreviewSlot";
import RecentBarcodesHeader from "./custom-slots/barcode-generator/RecentBarcodesHeader";
import BrokenLinkCheckerDataSlot from "./custom-slots/broken-link-checker/BrokenLinkCheckerDataSlot";
import BrokenLinkCheckerResultSlot from "./custom-slots/broken-link-checker/BrokenLinkCheckerResultSlot";
import LinkExpanderDataSlot from "./custom-slots/link-expander/LinkExpanderDataSlot";
import LinkExpanderResultSlot from "./custom-slots/link-expander/LinkExpanderResultSlot";
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

  if (slug === "link-expander") {
    return {
      secondary: <LinkExpanderResultSlot items={items} />,
      dataPanelDescription: items.length
        ? `${items.length} expanded link${items.length > 1 ? "s" : ""}.`
        : "Recent expanded links will appear here after you run a lookup.",
      dataPanelHeader: items.length ? (
        <ToolFeaturePill icon={BarChart3} label={`${items.length} total`} />
      ) : undefined,
      dataContent: (
        <LinkExpanderDataSlot items={items} deleteAction={deleteAction} />
      ),
    };
  }

  if (slug === "broken-link-checker") {
    return {
      secondary: <BrokenLinkCheckerResultSlot items={items} />,
      dataPanelDescription: items.length
        ? `${items.length} checked link${items.length > 1 ? "s" : ""}.`
        : "Recent link checks will appear here after you run a lookup.",
      dataPanelHeader: items.length ? (
        <ToolFeaturePill icon={BarChart3} label={`${items.length} total`} />
      ) : undefined,
      dataContent: (
        <BrokenLinkCheckerDataSlot
          items={items}
          deleteAction={deleteAction}
        />
      ),
    };
  }

  return {};
}
