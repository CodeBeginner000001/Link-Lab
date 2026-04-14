"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { cn } from "@/utils/tailwindcss-merger";
import { useToastNotification } from "@/utils/toast";
import {
  BarChart3,
  CheckCircle2,
  Copy,
  Download,
  Loader2,
  MousePointerClick,
  Palette,
  QrCode,
  Save,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import ToolEmptyState from "../component/common/ToolEmptyState";
import ToolFeaturePill from "../component/common/ToolFeaturePill";
import ToolMetricCard from "../component/common/ToolMetricCard";
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

type DotPattern =
  | "rounded"
  | "dots"
  | "square"
  | "classy"
  | "extra-round"
  | "classic";

type SavedQRCode = {
  id: string;
  type: QRContentType;
  content: string;
  foregroundColor: string;
  backgroundColor: string;
  dotPattern: DotPattern;
  createdAt: string;
  clicks: number;
  exports: {
    png: number;
    svg: number;
  };
};

const STORAGE_KEY = "linklab-qr-database-v1";

const DOT_PATTERN_OPTIONS: Array<{
  value: DotPattern;
  label: string;
}> = [
  { value: "rounded", label: "Rounded" },
  { value: "dots", label: "Dots" },
  { value: "square", label: "Square" },
  { value: "classy", label: "Classy" },
  { value: "extra-round", label: "Extra round" },
  { value: "classic", label: "Classic" },
];

const isDotPattern = (value: string): value is DotPattern =>
  DOT_PATTERN_OPTIONS.some((option) => option.value === value);

const drawRoundedRect = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) => {
  const safeRadius = Math.max(0, Math.min(radius, width / 2, height / 2));

  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.lineTo(x + width - safeRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  context.lineTo(x + width, y + height - safeRadius);
  context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  context.lineTo(x + safeRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  context.lineTo(x, y + safeRadius);
  context.quadraticCurveTo(x, y, x + safeRadius, y);
  context.closePath();
  context.fill();
};

const isFinderZone = (row: number, column: number, modules: number) => {
  const topLeft = row < 7 && column < 7;
  const topRight = row < 7 && column >= modules - 7;
  const bottomLeft = row >= modules - 7 && column < 7;

  return topLeft || topRight || bottomLeft;
};

const drawModule = ({
  context,
  x,
  y,
  size,
  pattern,
  row,
  column,
}: {
  context: CanvasRenderingContext2D;
  x: number;
  y: number;
  size: number;
  pattern: DotPattern;
  row: number;
  column: number;
}) => {
  switch (pattern) {
    case "dots":
      context.beginPath();
      context.arc(x + size / 2, y + size / 2, size * 0.34, 0, Math.PI * 2);
      context.fill();
      return;
    case "rounded":
      drawRoundedRect(context, x + size * 0.08, y + size * 0.08, size * 0.84, size * 0.84, size * 0.24);
      return;
    case "classy":
      if ((row + column) % 2 === 0) {
        context.beginPath();
        context.arc(x + size / 2, y + size / 2, size * 0.34, 0, Math.PI * 2);
        context.fill();
        return;
      }

      drawRoundedRect(context, x + size * 0.1, y + size * 0.1, size * 0.8, size * 0.8, size * 0.32);
      return;
    case "extra-round":
      drawRoundedRect(context, x + size * 0.06, y + size * 0.06, size * 0.88, size * 0.88, size * 0.46);
      return;
    case "classic":
      context.fillRect(x, y, size, size);
      context.clearRect(x + size * 0.27, y + size * 0.27, size * 0.46, size * 0.46);
      return;
    case "square":
    default:
      context.fillRect(x, y, size, size);
      return;
  }
};

const drawFinderPattern = ({
  context,
  x,
  y,
  moduleSize,
  foregroundColor,
  backgroundColor,
  pattern,
}: {
  context: CanvasRenderingContext2D;
  x: number;
  y: number;
  moduleSize: number;
  foregroundColor: string;
  backgroundColor: string;
  pattern: DotPattern;
}) => {
  const outerSize = moduleSize * 7;
  const middleSize = moduleSize * 5;
  const innerSize = moduleSize * 3;
  const drawCircle = pattern === "dots";
  const drawRounded =
    pattern === "rounded" || pattern === "classy" || pattern === "extra-round";

  context.fillStyle = foregroundColor;
  if (drawCircle) {
    context.beginPath();
    context.arc(x + outerSize / 2, y + outerSize / 2, outerSize / 2, 0, Math.PI * 2);
    context.fill();
  } else if (drawRounded) {
    drawRoundedRect(context, x, y, outerSize, outerSize, moduleSize * 1.1);
  } else {
    context.fillRect(x, y, outerSize, outerSize);
  }

  context.fillStyle = backgroundColor;
  if (drawCircle) {
    context.beginPath();
    context.arc(
      x + moduleSize + middleSize / 2,
      y + moduleSize + middleSize / 2,
      middleSize / 2,
      0,
      Math.PI * 2,
    );
    context.fill();
  } else if (drawRounded) {
    drawRoundedRect(
      context,
      x + moduleSize,
      y + moduleSize,
      middleSize,
      middleSize,
      moduleSize * 0.9,
    );
  } else {
    context.fillRect(x + moduleSize, y + moduleSize, middleSize, middleSize);
  }

  context.fillStyle = foregroundColor;
  if (drawCircle) {
    context.beginPath();
    context.arc(
      x + moduleSize * 2 + innerSize / 2,
      y + moduleSize * 2 + innerSize / 2,
      innerSize / 2,
      0,
      Math.PI * 2,
    );
    context.fill();
    return;
  }

  if (drawRounded) {
    drawRoundedRect(
      context,
      x + moduleSize * 2,
      y + moduleSize * 2,
      innerSize,
      innerSize,
      moduleSize * 0.6,
    );
    return;
  }

  context.fillRect(x + moduleSize * 2, y + moduleSize * 2, innerSize, innerSize);
};

const drawPseudoQr = (
  canvas: HTMLCanvasElement,
  content: string,
  foregroundColor: string,
  backgroundColor: string,
  dotPattern: DotPattern,
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
      if (isFinderZone(row, column, modules)) {
        continue;
      }

      const charCode = content.charCodeAt((row + column) % content.length);
      const hash = (charCode * (row + 3) * (column + 5) + row * 11 + column * 7) % 7;

      if (hash === 0 || hash === 1 || hash === 3) {
        drawModule({
          context,
          x: column * moduleSize,
          y: row * moduleSize,
          size: moduleSize,
          pattern: dotPattern,
          row,
          column,
        });
      }
    }
  }

  drawFinderPattern({
    context,
    x: 0,
    y: 0,
    moduleSize,
    foregroundColor,
    backgroundColor,
    pattern: dotPattern,
  });
  drawFinderPattern({
    context,
    x: canvas.width - moduleSize * 7,
    y: 0,
    moduleSize,
    foregroundColor,
    backgroundColor,
    pattern: dotPattern,
  });
  drawFinderPattern({
    context,
    x: 0,
    y: canvas.height - moduleSize * 7,
    moduleSize,
    foregroundColor,
    backgroundColor,
    pattern: dotPattern,
  });
};

const readStoredQRCodes = (): SavedQRCode[] => {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    if (!rawValue) {
      return [];
    }

    const parsedValue = JSON.parse(rawValue) as unknown;
    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue
      .filter((entry): entry is SavedQRCode => {
        if (!entry || typeof entry !== "object") {
          return false;
        }

        const record = entry as Partial<SavedQRCode>;
        return (
          typeof record.id === "string" &&
          typeof record.content === "string" &&
          typeof record.type === "string" &&
          isQRContentType(record.type) &&
          typeof record.foregroundColor === "string" &&
          typeof record.backgroundColor === "string" &&
          typeof record.dotPattern === "string" &&
          isDotPattern(record.dotPattern) &&
          typeof record.createdAt === "string" &&
          typeof record.clicks === "number" &&
          typeof record.exports === "object" &&
          record.exports !== null &&
          typeof record.exports.png === "number" &&
          typeof record.exports.svg === "number"
        );
      })
      .sort(
        (firstRecord, secondRecord) =>
          new Date(secondRecord.createdAt).getTime() -
          new Date(firstRecord.createdAt).getTime(),
      );
  } catch {
    return [];
  }
};

const formatDateTime = (value: string) =>
  new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const truncateValue = (value: string, maxLength: number) => {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength)}...`;
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
  const [dotPattern, setDotPattern] = useState<DotPattern>("rounded");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [qrGenerated, setQrGenerated] = useState(false);
  const [savedQRCodes, setSavedQRCodes] = useState<SavedQRCode[]>(
    () => readStoredQRCodes(),
  );
  const [activeSavedId, setActiveSavedId] = useState<string | null>(null);

  const selectedConfig = QR_CONTENT_CONFIG[qrType];
  const activeSavedQRCode = useMemo(
    () => savedQRCodes.find((record) => record.id === activeSavedId) ?? null,
    [savedQRCodes, activeSavedId],
  );

  useEffect(() => {
    if (!qrGenerated) {
      return;
    }

    const trimmedContent = content.trim();
    if (!trimmedContent) {
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    drawPseudoQr(
      canvas,
      trimmedContent,
      foregroundColor,
      backgroundColor,
      dotPattern,
    );
  }, [qrGenerated, content, foregroundColor, backgroundColor, dotPattern]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(savedQRCodes));
  }, [savedQRCodes]);

  const analytics = useMemo(() => {
    const typeDistribution = (
      Object.entries(QR_CONTENT_CONFIG) as [
        QRContentType,
        (typeof QR_CONTENT_CONFIG)[QRContentType],
      ][]
    ).map(([type, config]) => ({
      type,
      label: config.label,
      count: savedQRCodes.filter((record) => record.type === type).length,
    }));

    const patternDistribution = DOT_PATTERN_OPTIONS.map((option) => ({
      ...option,
      count: savedQRCodes.filter((record) => record.dotPattern === option.value)
        .length,
    }));

    const totalClicks = savedQRCodes.reduce(
      (sum, record) => sum + record.clicks,
      0,
    );
    const totalExports = savedQRCodes.reduce(
      (sum, record) => sum + record.exports.png + record.exports.svg,
      0,
    );

    const topPatternRecord =
      [...patternDistribution].sort((first, second) => second.count - first.count)[0] ??
      null;

    return {
      typeDistribution,
      patternDistribution,
      totalClicks,
      totalExports,
      maxTypeCount: Math.max(1, ...typeDistribution.map((entry) => entry.count)),
      maxPatternCount: Math.max(
        1,
        ...patternDistribution.map((entry) => entry.count),
      ),
      topPattern:
        topPatternRecord && topPatternRecord.count > 0
          ? topPatternRecord.label
          : "N/A",
    };
  }, [savedQRCodes]);

  const handleTypeChange = (value: string) => {
    if (!isQRContentType(value)) {
      return;
    }

    setQrType(value);
    setContent("");
    setQrGenerated(false);
    setActiveSavedId(null);
  };

  const drawPreview = ({
    payload,
    qrForeground,
    qrBackground,
    pattern,
  }: {
    payload: string;
    qrForeground: string;
    qrBackground: string;
    pattern: DotPattern;
  }) => {
    const canvas = canvasRef.current;
    if (!canvas) {
      notify("QR preview is not ready yet.", "error");
      return false;
    }

    drawPseudoQr(canvas, payload, qrForeground, qrBackground, pattern);
    setQrGenerated(true);
    return true;
  };

  const handleGenerate = async () => {
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      notify("Enter content for the QR code.", "warning");
      return;
    }

    setIsGenerating(true);
    await new Promise((resolve) => setTimeout(resolve, 350));
    const rendered = drawPreview({
      payload: trimmedContent,
      qrForeground: foregroundColor,
      qrBackground: backgroundColor,
      pattern: dotPattern,
    });
    setIsGenerating(false);
    if (!rendered) {
      return;
    }

    notify("Preview generated.", "success");
  };

  const handleFinalize = async () => {
    const trimmedContent = content.trim();
    if (!trimmedContent) {
      notify("Enter content before finalizing.", "warning");
      return;
    }

    if (!qrGenerated) {
      notify("Generate preview before finalizing.", "warning");
      return;
    }

    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 320));

    const newRecord: SavedQRCode = {
      id: crypto.randomUUID(),
      type: qrType,
      content: trimmedContent,
      foregroundColor,
      backgroundColor,
      dotPattern,
      createdAt: new Date().toISOString(),
      clicks: 0,
      exports: {
        png: 0,
        svg: 0,
      },
    };

    setSavedQRCodes((previousRecords) => [newRecord, ...previousRecords]);
    setActiveSavedId(newRecord.id);
    setIsSaving(false);
    notify("QR finalized and saved in database.", "success");
  };

  const handleCopyContent = async () => {
    try {
      await navigator.clipboard.writeText(content);
      notify("QR content copied.", "success");
    } catch {
      notify("Unable to copy QR content.", "error");
    }
  };

  const updateSavedRecord = (
    id: string,
    updater: (record: SavedQRCode) => SavedQRCode,
  ) => {
    setSavedQRCodes((previousRecords) =>
      previousRecords.map((record) => (record.id === id ? updater(record) : record)),
    );
  };

  const handleDownload = (format: "png" | "svg") => {
    const canvas = canvasRef.current;
    if (!canvas) {
      notify("Generate the QR preview before export.", "warning");
      return;
    }

    const link = document.createElement("a");
    const fileNameStem = `linklab-qr-${qrType}-${dotPattern}`.replace(/\s+/g, "-");

    if (format === "png") {
      link.download = `${fileNameStem}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      notify("QR exported as PNG.", "success");
    } else {
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

      link.download = `${fileNameStem}.svg`;
      link.href = objectUrl;
      link.click();
      setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
      notify("QR exported as SVG.", "success");
    }

    if (activeSavedId) {
      updateSavedRecord(activeSavedId, (record) => ({
        ...record,
        exports: {
          ...record.exports,
          [format]: record.exports[format] + 1,
        },
      }));
      return;
    }

    notify("Finalize this QR to track exports in analytics.", "info");
  };

  const handleSimulateClick = (id: string) => {
    updateSavedRecord(id, (record) => ({
      ...record,
      clicks: record.clicks + 1,
    }));
    notify("Click recorded.", "success");
  };

  const handleLoadSavedRecord = (record: SavedQRCode) => {
    setQrType(record.type);
    setContent(record.content);
    setForegroundColor(record.foregroundColor);
    setBackgroundColor(record.backgroundColor);
    setDotPattern(record.dotPattern);
    setActiveSavedId(record.id);
    drawPreview({
      payload: record.content,
      qrForeground: record.foregroundColor,
      qrBackground: record.backgroundColor,
      pattern: record.dotPattern,
    });
    notify("Saved QR loaded into preview.", "info");
  };

  return (
    <ToolPageShell
      icon={QrCode}
      heading="QR Code Generator"
      para="Design custom QR styles, finalize and save records, then monitor analytics in one place."
      iconClassName="h-6 w-6 text-primary"
    >
      <div className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(340px,0.9fr)]">
          <ToolPanel
            heading="Panel 1 · QR Builder"
            para="Choose content, customize colors, and apply a dot pattern before generating preview."
            headerSlot={<ToolFeaturePill icon={Palette} label="Design controls" />}
          >
            <ToolPillGroup className="mb-5">
              <ToolFeaturePill icon={QrCode} label="Pattern presets" />
              <ToolFeaturePill icon={Palette} label="Custom colors" />
              <ToolFeaturePill icon={Save} label="Finalize to database" />
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

              <div className="grid gap-2">
                <Label>Dot Pattern</Label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {DOT_PATTERN_OPTIONS.map((patternOption) => {
                    const isSelected = dotPattern === patternOption.value;

                    return (
                      <button
                        key={patternOption.value}
                        type="button"
                        onClick={() => setDotPattern(patternOption.value)}
                        className={cn(
                          "rounded-xl border px-3 py-2 text-left text-sm font-medium transition-colors",
                          isSelected
                            ? "border-[hsl(var(--primary))] bg-[hsl(var(--secondary)/0.56)] text-[hsl(var(--foreground))]"
                            : "border-[hsl(var(--border))] bg-[hsl(var(--background))] text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]",
                        )}
                      >
                        {patternOption.label}
                      </button>
                    );
                  })}
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
                    Generate Preview
                  </>
                )}
              </Button>
            </div>
          </ToolPanel>

          <ToolPanel
            heading="Panel 2 · Preview & Finalize"
            para="Review your QR output, export the file, and finalize to save in the database."
            headerSlot={
              <ToolFeaturePill
                label={
                  activeSavedQRCode
                    ? `Active record: ${truncateValue(activeSavedQRCode.id, 8)}`
                    : "Not finalized yet"
                }
              />
            }
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
                    description="Generate preview in panel 1 to render your selected pattern and colors."
                    className="min-h-0 w-full border-none bg-transparent p-0 shadow-none"
                  />
                ) : null}
              </ToolPreviewFrame>

              <ToolPillGroup>
                <ToolFeaturePill label={`Type: ${selectedConfig.label}`} />
                <ToolFeaturePill
                  label={`Pattern: ${
                    DOT_PATTERN_OPTIONS.find((option) => option.value === dotPattern)
                      ?.label ?? dotPattern
                  }`}
                />
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

              <Button
                onClick={handleFinalize}
                className="w-full"
                disabled={isSaving || !qrGenerated}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Finalize & Save To Database
                  </>
                )}
              </Button>
            </div>
          </ToolPanel>
        </div>

        <ToolPanel
          heading="QR Analytics"
          para="Track saved QR performance, click activity, and style usage across your records."
          headerSlot={
            <ToolFeaturePill
              icon={BarChart3}
              label={`${savedQRCodes.length} QR records`}
            />
          }
        >
          {savedQRCodes.length ? (
            <div className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <ToolMetricCard
                  label="Total Created"
                  value={savedQRCodes.length}
                  valueClassName="text-2xl"
                />
                <ToolMetricCard
                  label="Total Clicks"
                  value={analytics.totalClicks}
                  valueClassName="text-2xl"
                />
                <ToolMetricCard
                  label="Total Exports"
                  value={analytics.totalExports}
                  valueClassName="text-2xl"
                />
                <ToolMetricCard
                  label="Top Pattern"
                  value={analytics.topPattern}
                  valueClassName="text-xl"
                />
              </div>

              <div className="grid gap-4 xl:grid-cols-2">
                <section className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.2)] p-4">
                  <p className="text-sm font-semibold">By Content Type</p>
                  <div className="mt-4 space-y-3">
                    {analytics.typeDistribution.map((entry) => (
                      <div key={entry.type} className="flex items-center gap-3">
                        <span className="w-14 text-xs text-[hsl(var(--muted-foreground))]">
                          {entry.label}
                        </span>
                        <div className="h-2 flex-1 rounded-full bg-[hsl(var(--border)/0.65)]">
                          <div
                            className="h-2 rounded-full bg-[hsl(var(--primary))]"
                            style={{
                              width: `${Math.max(
                                entry.count
                                  ? (entry.count / analytics.maxTypeCount) * 100
                                  : 0,
                                entry.count ? 6 : 0,
                              )}%`,
                            }}
                          />
                        </div>
                        <span className="w-8 text-right text-xs text-[hsl(var(--muted-foreground))]">
                          {entry.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>

                <section className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.2)] p-4">
                  <p className="text-sm font-semibold">By Dot Pattern</p>
                  <div className="mt-4 space-y-3">
                    {analytics.patternDistribution.map((entry) => (
                      <div key={entry.value} className="flex items-center gap-3">
                        <span className="w-20 text-xs text-[hsl(var(--muted-foreground))]">
                          {entry.label}
                        </span>
                        <div className="h-2 flex-1 rounded-full bg-[hsl(var(--border)/0.65)]">
                          <div
                            className="h-2 rounded-full bg-[hsl(var(--primary))]"
                            style={{
                              width: `${Math.max(
                                entry.count
                                  ? (entry.count / analytics.maxPatternCount) * 100
                                  : 0,
                                entry.count ? 6 : 0,
                              )}%`,
                            }}
                          />
                        </div>
                        <span className="w-8 text-right text-xs text-[hsl(var(--muted-foreground))]">
                          {entry.count}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold">Saved QR Records</p>
                {savedQRCodes.slice(0, 8).map((record) => (
                  <article
                    key={record.id}
                    className={cn(
                      "rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.24)] p-4",
                      activeSavedId === record.id
                        ? "border-[hsl(var(--primary)/0.55)]"
                        : undefined,
                    )}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0 space-y-2">
                        <p className="truncate text-sm font-semibold">
                          {truncateValue(record.content, 78)}
                        </p>

                        <ToolPillGroup>
                          <ToolFeaturePill
                            label={`Type: ${QR_CONTENT_CONFIG[record.type].label}`}
                          />
                          <ToolFeaturePill
                            label={`Pattern: ${
                              DOT_PATTERN_OPTIONS.find(
                                (entry) => entry.value === record.dotPattern,
                              )?.label ?? record.dotPattern
                            }`}
                          />
                          <ToolFeaturePill label={`${record.clicks} clicks`} />
                          <ToolFeaturePill
                            label={`${record.exports.png + record.exports.svg} exports`}
                          />
                        </ToolPillGroup>

                        <p className="text-xs text-[hsl(var(--muted-foreground)/0.82)]">
                          Created {formatDateTime(record.createdAt)} · PNG{" "}
                          {record.exports.png} · SVG {record.exports.svg}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSimulateClick(record.id)}
                        >
                          <MousePointerClick className="h-4 w-4" />
                          Add Click
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleLoadSavedRecord(record)}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Load
                        </Button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <ToolEmptyState
              icon={BarChart3}
              title="No analytics yet"
              description="Finalize a QR code from panel 2, then click and export activity will appear here."
              className="min-h-[220px]"
            />
          )}
        </ToolPanel>
      </div>
    </ToolPageShell>
  );
};

export default QRGenerator;
