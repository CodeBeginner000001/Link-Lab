import ToolMetricCard from "../../common/ToolMetricCard";
import { BarcodeItem } from "@/service/dashboard/barcode-generator/type";

export default function BarcodePreviewMetrics({
  barcode,
}: {
  barcode: BarcodeItem | null;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <ToolMetricCard label="Format" value={barcode?.format ?? "—"} />
      <ToolMetricCard
        label="Height"
        value={barcode ? `${barcode.height} px` : "—"}
      />
      <ToolMetricCard
        label="Margin"
        value={barcode ? `${barcode.margin} px` : "—"}
      />
      <ToolMetricCard
        label="Quality"
        value={barcode ? "Print ready" : "—"}
        valueClassName={
          barcode ? "text-emerald-600 dark:text-emerald-400" : undefined
        }
      />
    </div>
  );
}
