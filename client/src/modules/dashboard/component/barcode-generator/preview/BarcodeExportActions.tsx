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
    <ToolPillGroup className="*:flex-1">
      <Button
        type="button"
        className="flex-1"
        disabled={!pngDownloadUrl}
        asChild={Boolean(pngDownloadUrl)}
      >
        {pngDownloadUrl ? (
          <a href={pngDownloadUrl} download={pngFilename}>
            <Download className="h-4 w-4" />
            Download PNG
          </a>
        ) : (
          <>
            <Download className="h-4 w-4" />
            Download PNG
          </>
        )}
      </Button>
      <Button
        type="button"
        variant="outline"
        className="flex-1"
        disabled={!svgDownloadUrl}
        asChild={Boolean(svgDownloadUrl)}
      >
        {svgDownloadUrl ? (
          <a href={svgDownloadUrl} download={svgFilename}>
            <FileImage className="h-4 w-4" />
            Download SVG
          </a>
        ) : (
          <>
            <FileImage className="h-4 w-4" />
            Download SVG
          </>
        )}
      </Button>
    </ToolPillGroup>
  );
}
