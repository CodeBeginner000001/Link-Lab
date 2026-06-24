"use client";

import { BarcodeItem } from "@/service/dashboard/barcode-generator/type";
import { useEffect, useState } from "react";
import BarcodeExportActions from "./BarcodeExportActions";
import BarcodePreviewCanvas from "./BarcodePreviewCanvas";
import BarcodePreviewMetrics from "./BarcodePreviewMetrics";

function getBarcodeFromCreateResponse(response: unknown): BarcodeItem | null {
  if (!response || typeof response !== "object") {
    return null;
  }

  const value = response as {
    data?: { barcode?: BarcodeItem };
    result?: { data?: { barcode?: BarcodeItem } };
  };

  return value.data?.barcode ?? value.result?.data?.barcode ?? null;
}

export default function BarcodeGeneratorPreviewSlot({
  barcode,
  isGenerating,
  eventName,
}: {
  barcode?: BarcodeItem | null;
  isGenerating?: boolean;
  eventName?: string;
}) {
  const [generatedBarcode, setGeneratedBarcode] = useState<BarcodeItem | null>(
    null,
  );
  const [isWaitingForBarcode, setIsWaitingForBarcode] = useState(false);
  const displayBarcode = barcode === undefined ? generatedBarcode : barcode;
  const displayGenerating =
    isGenerating === undefined ? isWaitingForBarcode : isGenerating;

  useEffect(() => {
    if (!eventName) {
      return;
    }

    const handleStart = () => {
      setGeneratedBarcode(null);
      setIsWaitingForBarcode(true);
    };
    const handleSuccess = (event: Event) => {
      const response = (event as CustomEvent<{ response?: unknown }>).detail
        ?.response;
      setGeneratedBarcode(getBarcodeFromCreateResponse(response));
    };
    const handleEnd = () => {
      setIsWaitingForBarcode(false);
    };

    window.addEventListener(`${eventName}:start`, handleStart);
    window.addEventListener(eventName, handleSuccess);
    window.addEventListener(`${eventName}:end`, handleEnd);

    return () => {
      window.removeEventListener(`${eventName}:start`, handleStart);
      window.removeEventListener(eventName, handleSuccess);
      window.removeEventListener(`${eventName}:end`, handleEnd);
    };
  }, [eventName]);

  return (
    <div className="min-w-0 space-y-4 max-[400px]:space-y-3">
      <BarcodePreviewCanvas
        barcode={displayBarcode}
        isGenerating={displayGenerating}
      />
      <BarcodePreviewMetrics barcode={displayBarcode} />
      <BarcodeExportActions barcode={displayBarcode} />
    </div>
  );
}
