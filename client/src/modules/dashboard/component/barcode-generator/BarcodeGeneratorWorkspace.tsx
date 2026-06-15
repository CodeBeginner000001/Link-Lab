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
    <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      <ToolPanel
        heading="Create Barcode"
        para="Set the format, encoded value, and visual output for your barcode."
        headerSlot={
          <ToolFeaturePill
            icon={Sparkles}
            label="Responsive form"
            className="max-[540px]:gap-1.5 max-[540px]:px-2.5 max-[540px]:py-1 max-[540px]:text-[10px] max-[540px]:[&_svg]:h-3 max-[540px]:[&_svg]:w-3"
          />
        }
        className="max-[540px]:rounded-xl max-[540px]:p-3 sm:p-5"
        headerClassName="max-[540px]:gap-3 max-[540px]:pb-3 max-[540px]:[&_h2]:text-lg max-[540px]:[&_p]:text-xs max-[540px]:[&_p]:leading-snug"
        bodyClassName="max-[540px]:pt-3"
      >
        <ToolPillGroup className="mb-4 gap-2 max-[540px]:mb-3 max-[540px]:[&>span]:gap-1.5 max-[540px]:[&>span]:px-2.5 max-[540px]:[&>span]:py-1 max-[540px]:[&>span]:text-[10px] max-[540px]:[&>span_svg]:h-3 max-[540px]:[&>span_svg]:w-3">
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
