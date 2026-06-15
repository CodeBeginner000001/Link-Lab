import { CheckCircle2 } from "lucide-react";
import { BarcodeItem } from "@/service/dashboard/barcode-generator/type";
import ToolFeaturePill from "../common/ToolFeaturePill";
import ToolPanel from "../common/ToolPanel";
import BarcodeExportActions from "./preview/BarcodeExportActions";
import BarcodePreviewCanvas from "./preview/BarcodePreviewCanvas";
import BarcodePreviewMetrics from "./preview/BarcodePreviewMetrics";

export default function BarcodePreviewPanel({
  barcode,
}: {
  barcode: BarcodeItem | null;
}) {
  return (
    <ToolPanel
      heading="Preview"
      para="Review the final barcode before choosing an export format."
      headerSlot={
        <ToolFeaturePill
          icon={CheckCircle2}
          label={barcode ? "Preview ready" : "Awaiting generation"}
        />
      }
      bodyClassName="space-y-5"
    >
      <BarcodePreviewCanvas barcode={barcode} />
      <BarcodePreviewMetrics barcode={barcode} />
      <BarcodeExportActions barcode={barcode} />
    </ToolPanel>
  );
}
