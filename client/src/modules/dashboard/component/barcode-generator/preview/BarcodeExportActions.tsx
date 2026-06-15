import { Button } from "@/components/ui/Button";
import {
  GetBarcodeDownloadFilename,
  GetBarcodeDownloadUrl,
} from "@/service/dashboard/barcode-generator";
import { BarcodeItem } from "@/service/dashboard/barcode-generator/type";
import { Download, FileImage } from "lucide-react";
import ToolPillGroup from "../../common/ToolPillGroup";

export default function BarcodeExportActions({
  barcode,
}: {
  barcode: BarcodeItem | null;
}) {
  const pngDownloadUrl = barcode
    ? GetBarcodeDownloadUrl(barcode.id, "png")
    : null;
  const svgDownloadUrl = barcode
    ? GetBarcodeDownloadUrl(barcode.id, "svg")
    : null;
  const pngFilename = barcode
    ? GetBarcodeDownloadFilename(barcode, "png")
    : undefined;
  const svgFilename = barcode
    ? GetBarcodeDownloadFilename(barcode, "svg")
    : undefined;

  return (
    <ToolPillGroup className="min-w-0 max-[400px]:flex-col *:flex-1">
      <Button
        type="button"
        className="flex-1 max-[400px]:h-9 max-[400px]:w-full max-[400px]:px-3 max-[400px]:text-xs"
        disabled={!pngDownloadUrl}
        asChild={Boolean(pngDownloadUrl)}
      >
        {pngDownloadUrl ? (
          <a href={pngDownloadUrl} download={pngFilename}>
            <Download className="h-4 w-4 max-[400px]:h-3.5 max-[400px]:w-3.5" />
            <span className="hidden min-[340px]:inline">Download </span>PNG
          </a>
        ) : (
          <>
            <Download className="h-4 w-4 max-[400px]:h-3.5 max-[400px]:w-3.5" />
            <span className="hidden min-[340px]:inline">Download </span>PNG
          </>
        )}
      </Button>
      <Button
        type="button"
        variant="outline"
        className="flex-1 max-[400px]:h-9 max-[400px]:w-full max-[400px]:px-3 max-[400px]:text-xs"
        disabled={!svgDownloadUrl}
        asChild={Boolean(svgDownloadUrl)}
      >
        {svgDownloadUrl ? (
          <a href={svgDownloadUrl} download={svgFilename}>
            <FileImage className="h-4 w-4 max-[400px]:h-3.5 max-[400px]:w-3.5" />
            <span className="hidden min-[340px]:inline">Download </span>SVG
          </a>
        ) : (
          <>
            <FileImage className="h-4 w-4 max-[400px]:h-3.5 max-[400px]:w-3.5" />
            <span className="hidden min-[340px]:inline">Download </span>SVG
          </>
        )}
      </Button>
    </ToolPillGroup>
  );
}
