import ToolMetricCard from "../../common/ToolMetricCard";
import { BarcodeItem } from "@/service/dashboard/barcode-generator/type";

export default function BarcodePreviewMetrics({
  barcode,
}: {
  barcode: BarcodeItem | null;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 max-[400px]:grid-cols-1 max-[400px]:gap-2 max-[540px]:gap-2 sm:grid-cols-4">
      <ToolMetricCard
        label="Format"
        value={barcode?.format ?? "—"}
        className="max-[540px]:rounded-lg max-[540px]:p-3"
        labelClassName="max-[540px]:text-[10px] max-[540px]:tracking-[0.14em]"
        valueClassName="max-[540px]:mt-1"
      />
      <ToolMetricCard
        label="Height"
        value={barcode ? `${barcode.height} px` : "—"}
        className="max-[540px]:rounded-lg max-[540px]:p-3"
        labelClassName="max-[540px]:text-[10px] max-[540px]:tracking-[0.14em]"
        valueClassName="max-[540px]:mt-1"
      />
      <ToolMetricCard
        label="Margin"
        value={barcode ? `${barcode.margin} px` : "—"}
        className="max-[540px]:rounded-lg max-[540px]:p-3"
        labelClassName="max-[540px]:text-[10px] max-[540px]:tracking-[0.14em]"
        valueClassName="max-[540px]:mt-1"
      />
      <ToolMetricCard
        label="Quality"
        value={barcode ? "Print ready" : "—"}
        className="max-[540px]:rounded-lg max-[540px]:p-3"
        labelClassName="max-[540px]:text-[10px] max-[540px]:tracking-[0.14em]"
        valueClassName={
          barcode
            ? "text-emerald-600 dark:text-emerald-400 max-[540px]:mt-1"
            : "max-[540px]:mt-1"
        }
      />
    </div>
  );
}
