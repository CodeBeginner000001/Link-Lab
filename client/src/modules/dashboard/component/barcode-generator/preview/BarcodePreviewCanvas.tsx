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
      className="relative overflow-hidden bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.08),transparent_42%),hsl(var(--secondary)/0.22)]"
      innerClassName="relative min-h-[330px] overflow-hidden bg-white px-5 py-10 sm:px-10"
    >
      <div className="absolute left-4 top-4 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-400">
        <span className="h-2 w-2 rounded-full bg-emerald-500" />
        Print preview
      </div>
      <Expand className="absolute right-4 top-4 h-4 w-4 text-slate-400" />

      {barcode ? (
        <div
          aria-label={`Generated ${barcode.format} barcode`}
          className="w-full max-w-155 [&_svg]:h-auto [&_svg]:max-h-60 [&_svg]:w-full"
          dangerouslySetInnerHTML={{ __html: barcode.svg }}
        />
      ) : (
        <div className="w-full max-w-155 opacity-25">
          <BarcodeVisual />
          <p className="mt-4 text-center text-sm text-slate-700">
            Generate a barcode to see the server-rendered preview.
          </p>
        </div>
      )}
    </ToolPreviewFrame>
  );
}
