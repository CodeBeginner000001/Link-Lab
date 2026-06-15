"use client";

import { Barcode, Download, Palette, Sparkles } from "lucide-react";
import { useState } from "react";
import {
  BarcodeFormatOption,
  BarcodeItem,
} from "@/service/dashboard/barcode-generator/type";
import ToolFeaturePill from "../common/ToolFeaturePill";
import ToolPanel from "../common/ToolPanel";
import ToolPillGroup from "../common/ToolPillGroup";
import BarcodeFormPanel from "./BarcodeFormPanel";
import BarcodePreviewPanel from "./BarcodePreviewPanel";

export default function BarcodeGeneratorWorkspace({
  formats,
}: {
  formats: BarcodeFormatOption[];
}) {
  const [barcode, setBarcode] = useState<BarcodeItem | null>(null);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(460px,1.1fr)]">
      <ToolPanel
        heading="Create Barcode"
        para="Set the format, encoded value, and visual output for your barcode."
        headerSlot={
          <ToolFeaturePill icon={Sparkles} label="Responsive form" />
        }
      >
        <ToolPillGroup className="mb-5">
          <ToolFeaturePill
            icon={Barcode}
            label={`${formats.length} barcode formats`}
          />
          <ToolFeaturePill icon={Download} label="PNG and SVG export" />
          <ToolFeaturePill icon={Palette} label="Custom appearance" />
        </ToolPillGroup>
        <BarcodeFormPanel formats={formats} onGenerated={setBarcode} />
      </ToolPanel>

      <BarcodePreviewPanel barcode={barcode} />
    </div>
  );
}
