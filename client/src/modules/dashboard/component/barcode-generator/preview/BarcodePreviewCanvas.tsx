import { Expand } from "lucide-react";
import { BarcodeItem } from "@/service/dashboard/barcode-generator/type";
import ToolPreviewFrame from "../../common/ToolPreviewFrame";
import BarcodeVisual from "../BarcodeVisual";

export default function BarcodePreviewCanvas({
  barcode,
}: {
  barcode: BarcodeItem | null;
}) {
  return (
    <ToolPreviewFrame
      className="relative min-w-0 overflow-hidden bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.08),transparent_42%),hsl(var(--secondary)/0.22)] p-3 max-[400px]:rounded-xl max-[400px]:p-2 lg:p-4"
      innerClassName="relative min-h-64 min-w-0 overflow-hidden bg-white px-5 py-8 max-[400px]:min-h-48 max-[400px]:rounded-xl max-[400px]:px-3 max-[400px]:pb-5 max-[400px]:pt-9 max-[540px]:min-h-60 lg:min-h-72 lg:px-8"
    >
      <div className="absolute left-4 top-4 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400 max-[400px]:left-3 max-[400px]:top-3 max-[400px]:gap-1.5 max-[400px]:text-[8px] max-[400px]:tracking-[0.14em]">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        Print preview
      </div>
      <Expand className="absolute right-4 top-4 h-4 w-4 text-slate-400 max-[400px]:right-3 max-[400px]:top-3 max-[400px]:h-3.5 max-[400px]:w-3.5" />

      {barcode ? (
        <div
          aria-label={`Generated ${barcode.format} barcode`}
          className="w-full max-w-155 [&_svg]:h-auto [&_svg]:max-h-44 [&_svg]:max-w-full [&_svg]:w-full max-[400px]:[&_svg]:max-h-32 lg:[&_svg]:max-h-52"
          dangerouslySetInnerHTML={{ __html: barcode.svg }}
        />
      ) : (
        <div className="w-full max-w-155 opacity-25 [&_svg]:max-w-full">
          <BarcodeVisual />
          <p className="mt-4 text-center text-sm text-slate-700 max-[400px]:mt-3 max-[400px]:text-xs">
            Generate a barcode to see the server-rendered preview.
          </p>
        </div>
      )}
    </ToolPreviewFrame>
  );
}
