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
          className="max-[400px]:gap-1.5 max-[400px]:px-2.5 max-[400px]:py-1 max-[400px]:text-[10px] max-[400px]:[&_svg]:h-3 max-[400px]:[&_svg]:w-3"
        />
      }
      className="min-w-0 max-[540px]:rounded-xl max-[540px]:p-3 sm:p-5"
      headerClassName="max-[540px]:gap-3 max-[540px]:pb-3 max-[540px]:[&_h2]:text-lg max-[540px]:[&_p]:text-xs max-[540px]:[&_p]:leading-snug"
      bodyClassName="min-w-0 space-y-4 max-[400px]:space-y-3 max-[540px]:pt-3"
    >
      <BarcodePreviewCanvas barcode={barcode} />
      <BarcodePreviewMetrics barcode={barcode} />
      <BarcodeExportActions barcode={barcode} />
    </ToolPanel>
  );
}
