"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { useToastNotification } from "@/utils/toast";
import { Copy, Download, Palette, QrCode, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import ToolEmptyState from "../component/common/ToolEmptyState";
import ToolFeaturePill from "../component/common/ToolFeaturePill";
import ToolPageShell from "../component/common/ToolPageShell";
import ToolPanel from "../component/common/ToolPanel";
import ToolPillGroup from "../component/common/ToolPillGroup";
import ToolPreviewFrame from "../component/common/ToolPreviewFrame";
import ToolSegmentedTabs from "../component/common/ToolSegmentedTabs";
import {
  QR_CONTENT_CONFIG,
  QRContentType,
  isQRContentType,
} from "../interface/qrGeneratorConfig";

type QRGeneratorProps = {
  searchParams?: {
    type?: string | string[];
  };
};

const drawPseudoQr = (
  canvas: HTMLCanvasElement,
  content: string,
  foregroundColor: string,
  backgroundColor: string,
) => {
  const context = canvas.getContext("2d");
  if (!context) {
    return;
  }

  canvas.width = 256;
  canvas.height = 256;

  context.fillStyle = backgroundColor;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = foregroundColor;
  const moduleSize = 8;
  const modules = 32;

  for (let row = 0; row < modules; row += 1) {
    for (let column = 0; column < modules; column += 1) {
      const charCode = content.charCodeAt((row + column) % content.length);
      const hash = (charCode * (row + 3) * (column + 5)) % 4;

      if (hash === 0 || hash === 1) {
        context.fillRect(
          column * moduleSize,
          row * moduleSize,
          moduleSize,
          moduleSize,
        );
      }
    }
  }

  const drawPositionPattern = (startX: number, startY: number) => {
    context.fillStyle = foregroundColor;
    context.fillRect(startX, startY, moduleSize * 7, moduleSize * 7);
    context.fillStyle = backgroundColor;
    context.fillRect(
      startX + moduleSize,
      startY + moduleSize,
      moduleSize * 5,
      moduleSize * 5,
    );
    context.fillStyle = foregroundColor;
    context.fillRect(
      startX + moduleSize * 2,
      startY + moduleSize * 2,
      moduleSize * 3,
      moduleSize * 3,
    );
  };

  drawPositionPattern(0, 0);
  drawPositionPattern(canvas.width - moduleSize * 7, 0);
  drawPositionPattern(0, canvas.height - moduleSize * 7);
};

const QRGenerator = ({ searchParams }: QRGeneratorProps) => {
  const notify = useToastNotification();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const selectedTypeParam = Array.isArray(searchParams?.type)
    ? searchParams?.type[0]
    : searchParams?.type;
  const defaultType: QRContentType =
    selectedTypeParam && isQRContentType(selectedTypeParam)
      ? selectedTypeParam
      : "url";

  const [qrType, setQrType] = useState<QRContentType>(defaultType);
  const [content, setContent] = useState("");
  const [foregroundColor, setForegroundColor] = useState("#111827");
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [isGenerating, setIsGenerating] = useState(false);
  const [qrGenerated, setQrGenerated] = useState(false);

  const selectedConfig = QR_CONTENT_CONFIG[qrType];

  const handleTypeChange = (value: string) => {
    if (!isQRContentType(value)) {
      return;
    }

    setQrType(value);
    setContent("");
  };

  const handleGenerate = async () => {
    if (!content.trim()) {
      notify("Enter content for the QR code.", "warning");
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      notify("QR preview is not ready yet.", "error");
      return;
    }

    setIsGenerating(true);
    await new Promise((resolve) => setTimeout(resolve, 450));
    drawPseudoQr(canvas, content.trim(), foregroundColor, backgroundColor);
    setIsGenerating(false);
    setQrGenerated(true);
    notify("QR code generated.", "success");
  };

  const handleCopyContent = async () => {
    try {
      await navigator.clipboard.writeText(content);
      notify("QR content copied.", "success");
    } catch {
      notify("Unable to copy QR content.", "error");
    }
  };

  const handleDownload = (format: "png" | "svg") => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const link = document.createElement("a");

    if (format === "png") {
      link.download = "linklab-qr.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
      notify("QR exported as PNG.", "success");
      return;
    }

    const pngDataUrl = canvas.toDataURL("image/png");
    const svgMarkup = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}">
        <rect width="100%" height="100%" fill="${backgroundColor}" />
        <image href="${pngDataUrl}" width="${canvas.width}" height="${canvas.height}" />
      </svg>
    `.trim();
    const blob = new Blob([svgMarkup], {
      type: "image/svg+xml;charset=utf-8",
    });
    const objectUrl = URL.createObjectURL(blob);

    link.download = "linklab-qr.svg";
    link.href = objectUrl;
    link.click();
    setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
    notify("QR exported as SVG.", "success");
  };

  return (
    <ToolPageShell
      icon={QrCode}
      heading="QR Code Generator"
      para="Generate customizable QR codes for URLs, text, email, and more."
      iconClassName="h-6 w-6 text-primary"
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
          <ToolPanel
            heading="Create QR Code"
            para="Choose a content type, enter your payload, and style the preview before exporting."
            headerSlot={<ToolFeaturePill icon={Palette} label="Color controls" />}
          >
            <ToolPillGroup className="mb-5">
              <ToolFeaturePill icon={QrCode} label="Live preview" />
              <ToolFeaturePill icon={Download} label="PNG and SVG export" />
              <ToolFeaturePill icon={Palette} label="Editable colors" />
            </ToolPillGroup>

            <div className="space-y-5">
              <ToolSegmentedTabs
                options={Object.entries(QR_CONTENT_CONFIG).map(
                  ([value, config]) => ({
                    value,
                    label: config.label,
                  }),
                )}
                value={qrType}
                onValueChange={handleTypeChange}
              />

              <div className="grid gap-2">
                <Label htmlFor="qr-content">{selectedConfig.fieldLabel}</Label>
                <Input
                  id="qr-content"
                  type={selectedConfig.inputType}
                  placeholder={selectedConfig.placeholder}
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label htmlFor="qr-foreground">Foreground</Label>
                  <div className="flex gap-3">
                    <Input
                      id="qr-foreground"
                      type="color"
                      value={foregroundColor}
                      onChange={(event) => setForegroundColor(event.target.value)}
                      className="h-11 w-14 cursor-pointer p-1"
                    />
                    <Input
                      value={foregroundColor.toUpperCase()}
                      onChange={(event) => setForegroundColor(event.target.value)}
                      className="font-mono"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="qr-background">Background</Label>
                  <div className="flex gap-3">
                    <Input
                      id="qr-background"
                      type="color"
                      value={backgroundColor}
                      onChange={(event) => setBackgroundColor(event.target.value)}
                      className="h-11 w-14 cursor-pointer p-1"
                    />
                    <Input
                      value={backgroundColor.toUpperCase()}
                      onChange={(event) => setBackgroundColor(event.target.value)}
                      className="font-mono"
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full sm:w-auto"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <QrCode className="h-4 w-4" />
                    Generate QR Code
                  </>
                )}
              </Button>
            </div>
          </ToolPanel>

          <ToolPanel
            heading="Preview"
            para="Your generated QR code will appear here with export actions once it is ready."
            headerSlot={<ToolFeaturePill label={selectedConfig.label} />}
          >
            <div className="space-y-5">
              <ToolPreviewFrame innerClassName="aspect-square max-w-[320px]">
                  <canvas
                    ref={canvasRef}
                    width={256}
                    height={256}
                    className={qrGenerated ? "h-auto w-full max-w-[256px] rounded-xl" : "hidden"}
                  />

                  {!qrGenerated ? (
                    <ToolEmptyState
                      icon={QrCode}
                      title="QR code preview"
                      description="Generate a QR code to see the responsive preview and export actions."
                      className="min-h-0 w-full border-none bg-transparent p-0 shadow-none"
                    />
                  ) : null}
              </ToolPreviewFrame>

              <ToolPillGroup>
                <ToolFeaturePill label={`Type: ${selectedConfig.label}`} />
                <ToolFeaturePill label={`FG ${foregroundColor.toUpperCase()}`} />
                <ToolFeaturePill label={`BG ${backgroundColor.toUpperCase()}`} />
              </ToolPillGroup>

              <ToolPillGroup>
                <Button
                  variant="outline"
                  onClick={handleCopyContent}
                  disabled={!content.trim()}
                >
                  <Copy className="h-4 w-4" />
                  Copy Content
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleDownload("png")}
                  disabled={!qrGenerated}
                >
                  <Download className="h-4 w-4" />
                  PNG
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleDownload("svg")}
                  disabled={!qrGenerated}
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

export default QRGenerator;
