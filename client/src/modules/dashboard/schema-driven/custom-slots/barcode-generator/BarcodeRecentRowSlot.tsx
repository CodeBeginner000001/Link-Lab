"use client";

import RecentBarcodeRow from "./RecentBarcodeRow";
import type { RecentBarcode } from "./types";
import type { SchemaDeleteAction } from "../../types";

type BarcodeRecentRowSlotProps = {
  barcode: Record<string, unknown>;
  deleteAction?: SchemaDeleteAction;
};

function toRecentBarcode(barcode: Record<string, unknown>): RecentBarcode {
  return {
    id: String(barcode.id ?? ""),
    format: String(barcode.format ?? "-"),
    content: String(barcode.content ?? "-"),
    svg: String(barcode.svg ?? ""),
    totalDownloads: Number(barcode.totalDownloads ?? 0),
    downloadCounts:
      typeof barcode.downloadCounts === "object" && barcode.downloadCounts
        ? (barcode.downloadCounts as RecentBarcode["downloadCounts"])
        : { svg: 0, png: 0 },
    createdAt:
      typeof barcode.createdAt === "string" ? barcode.createdAt : null,
  };
}

export default function BarcodeRecentRowSlot({
  barcode,
  deleteAction,
}: BarcodeRecentRowSlotProps) {
  return (
    <RecentBarcodeRow
      barcode={toRecentBarcode(barcode)}
      deleteAction={deleteAction}
    />
  );
}
