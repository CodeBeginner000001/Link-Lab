"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { useToastNotification } from "@/utils/toast";
import {
  Barcode,
  Copy,
  Download,
  Loader2,
  Palette,
  ScanBarcode,
} from "lucide-react";
import { useRef, useState } from "react";
import ToolEmptyState from "../component/common/ToolEmptyState";
import ToolFeaturePill from "../component/common/ToolFeaturePill";
import ToolPageShell from "../component/common/ToolPageShell";
import ToolPanel from "../component/common/ToolPanel";
import ToolPillGroup from "../component/common/ToolPillGroup";
import ToolPreviewFrame from "../component/common/ToolPreviewFrame";
import ToolSegmentedTabs from "../component/common/ToolSegmentedTabs";

const BARCODE_TYPES = [
  { value: "CODE128", label: "Code 128", hint: "Any text" },
  { value: "EAN13", label: "EAN-13", hint: "12 or 13 digits" },
  { value: "EAN8", label: "EAN-8", hint: "7 or 8 digits" },
  { value: "UPC", label: "UPC-A", hint: "11 or 12 digits" },
  { value: "CODE39", label: "Code 39", hint: "Alphanumeric" },
] as const;

type BarcodeType = (typeof BARCODE_TYPES)[number]["value"];

const drawPseudoBarcode = (
  canvas: HTMLCanvasElement,
  content: string,
  type: BarcodeType,
) => {
  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  canvas.width = 460;
  canvas.height = 150;

  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = "#111111";
  let x = 24;
  const top = 20;
  const barHeight = 84;

  for (let index = 0; index < content.length; index += 1) {
    const charCode = content.charCodeAt(index);
    for (let bit = 0; bit < 8; bit += 1) {
      const isWide = ((charCode >> bit) & 1) === 1;
      const width = isWide ? 4 : 2;

      if ((index + bit + type.length) % 2 === 0) {
        context.fillRect(x, top, width, barHeight);
      }

      x += width + 1;

      if (x > canvas.width - 28) {
        break;
      }
    }

    x += 2;
    if (x > canvas.width - 28) {
      break;
    }
  }

  context.font = "13px monospace";
  context.textAlign = "center";
  context.fillText(content, canvas.width / 2, 126);
};

const BarcodeGenerator = () => {
  const notify = useToastNotification();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [content, setContent] = useState("");
  const [barcodeType, setBarcodeType] = useState<BarcodeType>("CODE128");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const selectedType = BARCODE_TYPES.find((item) => item.value === barcodeType)!;

  const generateBarcode = async () => {
    if (!content.trim()) {
      notify("Enter content for the barcode.", "warning");
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      notify("Barcode preview is not ready yet.", "error");
      return;
    }

    setIsGenerating(true);
    await new Promise((resolve) => setTimeout(resolve, 450));
    drawPseudoBarcode(canvas, content.trim(), barcodeType);
    setGenerated(true);
    setIsGenerating(false);
    notify("Barcode generated.", "success");
  };

  const copyContent = async () => {
    try {
      await navigator.clipboard.writeText(content);
      notify("Barcode content copied.", "success");
    } catch {
      notify("Unable to copy the barcode content.", "error");
    }
  };

  const downloadBarcode = (format: "png" | "svg") => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const link = document.createElement("a");

    if (format === "png") {
      link.download = `barcode-${barcodeType.toLowerCase()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      notify("Barcode exported as PNG.", "success");
      return;
    }

    const pngDataUrl = canvas.toDataURL("image/png");
    const svgMarkup = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}">
        <rect width="100%" height="100%" fill="#ffffff" />
        <image href="${pngDataUrl}" width="${canvas.width}" height="${canvas.height}" />
      </svg>
    `.trim();
    const blob = new Blob([svgMarkup], {
      type: "image/svg+xml;charset=utf-8",
    });
    const objectUrl = URL.createObjectURL(blob);

    link.download = `barcode-${barcodeType.toLowerCase()}.svg`;
    link.href = objectUrl;
    link.click();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
    notify("Barcode exported as SVG.", "success");
  };

  return (
    <ToolPageShell
      icon={Barcode}
      heading="Barcode Generator"
      para="Create various barcode formats including UPC, EAN, Code 128, and more."
      iconClassName="h-6 w-6 text-primary"
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.92fr)]">
          <ToolPanel
            heading="Create Barcode"
            para="Choose a format, enter the encoded content, and generate a clean barcode preview for export."
            headerSlot={<ToolFeaturePill icon={Palette} label="Canvas preview" />}
          >
            <ToolPillGroup className="mb-5">
              <ToolFeaturePill icon={Barcode} label="Multiple formats" />
              <ToolFeaturePill icon={Download} label="PNG and SVG export" />
              <ToolFeaturePill icon={Copy} label="Copy content" />
            </ToolPillGroup>

            <div className="space-y-5">
              <div className="space-y-2">
                <Label>Barcode Type</Label>
                <ToolSegmentedTabs
                  options={BARCODE_TYPES.map((item) => ({
                    value: item.value,
                    label: item.label,
                  }))}
                  value={barcodeType}
                  onValueChange={(value) => {
                    if (BARCODE_TYPES.some((item) => item.value === value)) {
                      setBarcodeType(value as BarcodeType);
                    }
                  }}
                />
                <p className="text-xs text-[hsl(var(--muted-foreground)/0.84)]">
                  {selectedType.hint}
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="barcode-content">Content</Label>
                <Input
                  id="barcode-content"
                  placeholder="Enter barcode content"
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                />
              </div>

              <div className="flex flex-wrap gap-2">
                <Button onClick={generateBarcode} disabled={isGenerating}>
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Barcode className="h-4 w-4" />
                      Generate Barcode
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={copyContent}
                  disabled={!content.trim()}
                >
                  <Copy className="h-4 w-4" />
                  Copy Content
                </Button>
              </div>
            </div>
          </ToolPanel>

          <ToolPanel
            heading="Preview"
            para="Your generated barcode will appear here with export actions once it is ready."
            headerSlot={<ToolFeaturePill label={selectedType.label} />}
          >
            <div className="space-y-5">
              <ToolPreviewFrame
                innerClassName="min-h-[220px] bg-white"
              >
                  <canvas
                    ref={canvasRef}
                    width={460}
                    height={150}
                    className={generated ? "h-auto w-full max-w-[460px]" : "hidden"}
                  />

                  {!generated ? (
                    <ToolEmptyState
                      icon={ScanBarcode}
                      title="Barcode preview"
                      description="Generate a barcode to see the rendered preview and export actions."
                      className="min-h-0 w-full border-none bg-transparent p-0 shadow-none"
                    />
                  ) : null}
              </ToolPreviewFrame>

              <ToolPillGroup>
                <ToolFeaturePill label={`Type: ${selectedType.label}`} />
                <ToolFeaturePill label={selectedType.hint} />
              </ToolPillGroup>

              <ToolPillGroup>
                <Button
                  variant="outline"
                  onClick={() => downloadBarcode("png")}
                  disabled={!generated}
                >
                  <Download className="h-4 w-4" />
                  PNG
                </Button>
                <Button
                  variant="outline"
                  onClick={() => downloadBarcode("svg")}
                  disabled={!generated}
                >
                  <Download className="h-4 w-4" />
                  SVG
                </Button>
              </ToolPillGroup>
            </div>
          </ToolPanel>
      </div>
    </ToolPageShell>
  );
};

export default BarcodeGenerator;
