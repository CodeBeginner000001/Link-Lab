"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { cn } from "@/utils/tailwindcss-merger";
import { useToastNotification } from "@/utils/toast";
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  Circle,
  Copy,
  Download,
  Eye,
  Loader2,
  MousePointerClick,
  Palette,
  QrCode,
  Save,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ToolEmptyState from "../common/ToolEmptyState";
import ToolExpandableRows from "../common/ToolExpandableRows";
import ToolFeaturePill from "../common/ToolFeaturePill";
import ToolMetricCard from "../common/ToolMetricCard";
import ToolPageShell from "../common/ToolPageShell";
import ToolPanel from "../common/ToolPanel";
import ToolPillGroup from "../common/ToolPillGroup";
import ToolPreviewFrame from "../common/ToolPreviewFrame";
import ToolSegmentedTabs from "../common/ToolSegmentedTabs";
import {
  QR_CONTENT_CONFIG,
  QRContentType,
  isQRContentType,
} from "../../interface/qrGeneratorConfig";

type QRGeneratorProps = {
  searchParams?: {
    type?: string | string[];
  };
};

type BodyShape =
  | "square"
  | "dots"
  | "rounded"
  | "classy"
  | "diamond"
  | "horizontal"
  | "vertical"
  | "star"
  | "mosaic"
  | "arrow";

type EyeFrameShape =
  | "square"
  | "rounded"
  | "circle"
  | "dotted"
  | "inset"
  | "shield";

type EyeBallShape =
  | "square"
  | "rounded"
  | "circle"
  | "diamond"
  | "leaf"
  | "stripe";

type SavedQRCode = {
  id: string;
  type: QRContentType;
  content: string;
  foregroundColor: string;
  backgroundColor: string;
  bodyShape: BodyShape;
  eyeFrame: EyeFrameShape;
  eyeBall: EyeBallShape;
  qrPadding: number;
  createdAt: string;
  clicks: number;
  exports: {
    png: number;
    svg: number;
  };
};

type BuilderState = {
  qrType: QRContentType;
  content: string;
  foregroundColor: string;
  backgroundColor: string;
  bodyShape: BodyShape;
  eyeFrame: EyeFrameShape;
  eyeBall: EyeBallShape;
  qrPadding: number;
  isGenerating: boolean;
  isSaving: boolean;
  qrGenerated: boolean;
  hasGeneratedOnce: boolean;
  trimmedContent: string;
  selectedConfig: (typeof QR_CONTENT_CONFIG)[QRContentType];
};

type BuilderActions = {
  onTypeChange: (value: string) => void;
  onContentChange: (value: string) => void;
  onForegroundChange: (value: string) => void;
  onBackgroundChange: (value: string) => void;
  onBodyShapeChange: (value: BodyShape) => void;
  onEyeFrameChange: (value: EyeFrameShape) => void;
  onEyeBallChange: (value: EyeBallShape) => void;
  onPaddingChange: (value: number) => void;
  onGenerate: () => Promise<void>;
  onFinalize: () => Promise<void>;
  onCopyContent: () => Promise<void>;
  onDownload: (format: "png" | "svg") => void;
};

type PreviewState = {
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  qrGenerated: boolean;
  hasPreviewContent: boolean;
  activeSavedQRCode: SavedQRCode | null;
  bodyShape: BodyShape;
  eyeFrame: EyeFrameShape;
  eyeBall: EyeBallShape;
  foregroundColor: string;
  backgroundColor: string;
  qrPadding: number;
  selectedConfig: (typeof QR_CONTENT_CONFIG)[QRContentType];
  trimmedContent: string;
  isSaving: boolean;
};

type AnalyticsState = {
  typeDistribution: Array<{
    type: QRContentType;
    label: string;
    count: number;
  }>;
  bodyDistribution: Array<{
    value: BodyShape;
    label: string;
    count: number;
  }>;
  totalClicks: number;
  totalExports: number;
  maxTypeCount: number;
  maxBodyCount: number;
  topBody: string;
  topClickedRecord: SavedQRCode | null;
  latestRecord: SavedQRCode | null;
};

const STORAGE_KEY = "linklab-qr-database-v5";

const BODY_SHAPE_OPTIONS: Array<{ value: BodyShape; label: string }> = [
  { value: "square", label: "Square" },
  { value: "dots", label: "Dots" },
  { value: "rounded", label: "Rounded" },
  { value: "classy", label: "Classy" },
  { value: "diamond", label: "Diamond" },
  { value: "horizontal", label: "H-Line" },
  { value: "vertical", label: "V-Line" },
  { value: "star", label: "Star" },
  { value: "mosaic", label: "Mosaic" },
  { value: "arrow", label: "Arrow" },
];

const EYE_FRAME_OPTIONS: Array<{ value: EyeFrameShape; label: string }> = [
  { value: "square", label: "Square" },
  { value: "rounded", label: "Rounded" },
  { value: "circle", label: "Circle" },
  { value: "dotted", label: "Dotted" },
  { value: "inset", label: "Inset" },
  { value: "shield", label: "Shield" },
];

const EYE_BALL_OPTIONS: Array<{ value: EyeBallShape; label: string }> = [
  { value: "square", label: "Square" },
  { value: "rounded", label: "Rounded" },
  { value: "circle", label: "Circle" },
  { value: "diamond", label: "Diamond" },
  { value: "leaf", label: "Leaf" },
  { value: "stripe", label: "Stripe" },
];

const isBodyShape = (value: string): value is BodyShape =>
  BODY_SHAPE_OPTIONS.some((option) => option.value === value);

const isEyeFrameShape = (value: string): value is EyeFrameShape =>
  EYE_FRAME_OPTIONS.some((option) => option.value === value);

const isEyeBallShape = (value: string): value is EyeBallShape =>
  EYE_BALL_OPTIONS.some((option) => option.value === value);

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

const drawBodyModule = ({
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
  pattern: BodyShape;
  row: number;
  column: number;
}) => {
  switch (pattern) {
    case "dots":
      context.beginPath();
      context.arc(x + size / 2, y + size / 2, size * 0.36, 0, Math.PI * 2);
      context.fill();
      return;

    case "rounded":
      drawRoundedRect(
        context,
        x + size * 0.08,
        y + size * 0.08,
        size * 0.84,
        size * 0.84,
        size * 0.28,
      );
      return;

    case "classy":
      if ((row + column) % 2 === 0) {
        context.beginPath();
        context.arc(x + size / 2, y + size / 2, size * 0.34, 0, Math.PI * 2);
        context.fill();
      } else {
        drawRoundedRect(
          context,
          x + size * 0.1,
          y + size * 0.1,
          size * 0.8,
          size * 0.8,
          size * 0.32,
        );
      }
      return;

    case "diamond":
      context.beginPath();
      context.moveTo(x + size / 2, y + size * 0.05);
      context.lineTo(x + size * 0.95, y + size / 2);
      context.lineTo(x + size / 2, y + size * 0.95);
      context.lineTo(x + size * 0.05, y + size / 2);
      context.closePath();
      context.fill();
      return;

    case "horizontal":
      drawRoundedRect(context, x, y + size * 0.2, size, size * 0.6, size * 0.15);
      return;

    case "vertical":
      drawRoundedRect(context, x + size * 0.2, y, size * 0.6, size, size * 0.15);
      return;

    case "star": {
      context.beginPath();
      const cx = x + size / 2;
      const cy = y + size / 2;

      for (let i = 0; i < 5; i += 1) {
        const outerAngle = ((i * 72 - 90) * Math.PI) / 180;
        const innerAngle = (((i * 72 + 36) - 90) * Math.PI) / 180;

        context.lineTo(
          cx + Math.cos(outerAngle) * size * 0.42,
          cy + Math.sin(outerAngle) * size * 0.42,
        );
        context.lineTo(
          cx + Math.cos(innerAngle) * size * 0.18,
          cy + Math.sin(innerAngle) * size * 0.18,
        );
      }

      context.closePath();
      context.fill();
      return;
    }

    case "mosaic":
      if ((row + column) % 2 === 0) {
        context.fillRect(x + size * 0.05, y + size * 0.05, size * 0.42, size * 0.42);
        context.fillRect(x + size * 0.53, y + size * 0.53, size * 0.42, size * 0.42);
      } else {
        context.fillRect(x + size * 0.05, y + size * 0.53, size * 0.42, size * 0.42);
        context.fillRect(x + size * 0.53, y + size * 0.05, size * 0.42, size * 0.42);
      }
      return;

    case "arrow":
      context.beginPath();
      context.moveTo(x + size * 0.5, y + size * 0.05);
      context.lineTo(x + size * 0.95, y + size * 0.5);
      context.lineTo(x + size * 0.7, y + size * 0.5);
      context.lineTo(x + size * 0.7, y + size * 0.95);
      context.lineTo(x + size * 0.3, y + size * 0.95);
      context.lineTo(x + size * 0.3, y + size * 0.5);
      context.lineTo(x + size * 0.05, y + size * 0.5);
      context.closePath();
      context.fill();
      return;

    case "square":
    default:
      context.fillRect(x, y, size, size);
  }
};

const drawEyeFrame = ({
  context,
  x,
  y,
  moduleSize,
  foregroundColor,
  backgroundColor,
  shape,
}: {
  context: CanvasRenderingContext2D;
  x: number;
  y: number;
  moduleSize: number;
  foregroundColor: string;
  backgroundColor: string;
  shape: EyeFrameShape;
}) => {
  const outer = moduleSize * 7;
  const middle = moduleSize * 5;

  context.fillStyle = foregroundColor;

  switch (shape) {
    case "circle":
      context.beginPath();
      context.arc(x + outer / 2, y + outer / 2, outer / 2, 0, Math.PI * 2);
      context.fill();

      context.fillStyle = backgroundColor;
      context.beginPath();
      context.arc(x + outer / 2, y + outer / 2, middle / 2, 0, Math.PI * 2);
      context.fill();
      return;

    case "rounded":
      drawRoundedRect(context, x, y, outer, outer, moduleSize * 1.4);
      context.fillStyle = backgroundColor;
      drawRoundedRect(
        context,
        x + moduleSize,
        y + moduleSize,
        middle,
        middle,
        moduleSize,
      );
      return;

    case "dotted": {
      const dotSize = moduleSize * 0.6;
      const gap = moduleSize;

      for (let i = 0; i < 7; i += 1) {
        context.beginPath();
        context.arc(x + i * gap + gap / 2, y + gap / 2, dotSize / 2, 0, Math.PI * 2);
        context.fill();

        context.beginPath();
        context.arc(
          x + i * gap + gap / 2,
          y + outer - gap / 2,
          dotSize / 2,
          0,
          Math.PI * 2,
        );
        context.fill();

        if (i > 0 && i < 6) {
          context.beginPath();
          context.arc(x + gap / 2, y + i * gap + gap / 2, dotSize / 2, 0, Math.PI * 2);
          context.fill();

          context.beginPath();
          context.arc(
            x + outer - gap / 2,
            y + i * gap + gap / 2,
            dotSize / 2,
            0,
            Math.PI * 2,
          );
          context.fill();
        }
      }
      return;
    }

    case "inset":
      context.fillRect(x, y, outer, outer);

      context.fillStyle = backgroundColor;
      context.fillRect(
        x + moduleSize * 0.6,
        y + moduleSize * 0.6,
        outer - moduleSize * 1.2,
        outer - moduleSize * 1.2,
      );

      context.fillStyle = foregroundColor;
      context.fillRect(
        x + moduleSize * 1.2,
        y + moduleSize * 1.2,
        outer - moduleSize * 2.4,
        outer - moduleSize * 2.4,
      );

      context.fillStyle = backgroundColor;
      context.fillRect(x + moduleSize, y + moduleSize, middle, middle);
      return;

    case "shield":
      context.beginPath();
      context.moveTo(x + outer / 2, y);
      context.lineTo(x + outer, y + moduleSize * 1.5);
      context.lineTo(x + outer, y + outer * 0.7);
      context.quadraticCurveTo(x + outer / 2, y + outer * 1.1, x, y + outer * 0.7);
      context.lineTo(x, y + moduleSize * 1.5);
      context.closePath();
      context.fill();

      context.fillStyle = backgroundColor;
      drawRoundedRect(
        context,
        x + moduleSize,
        y + moduleSize,
        middle,
        middle,
        moduleSize * 0.5,
      );
      return;

    case "square":
    default:
      context.fillRect(x, y, outer, outer);
      context.fillStyle = backgroundColor;
      context.fillRect(x + moduleSize, y + moduleSize, middle, middle);
  }
};

const drawEyeBall = ({
  context,
  x,
  y,
  moduleSize,
  foregroundColor,
  shape,
}: {
  context: CanvasRenderingContext2D;
  x: number;
  y: number;
  moduleSize: number;
  foregroundColor: string;
  shape: EyeBallShape;
}) => {
  const inner = moduleSize * 3;
  const startX = x + moduleSize * 2;
  const startY = y + moduleSize * 2;
  const centerX = startX + inner / 2;
  const centerY = startY + inner / 2;

  context.fillStyle = foregroundColor;

  switch (shape) {
    case "circle":
      context.beginPath();
      context.arc(centerX, centerY, inner / 2, 0, Math.PI * 2);
      context.fill();
      return;

    case "rounded":
      drawRoundedRect(context, startX, startY, inner, inner, moduleSize * 0.8);
      return;

    case "diamond":
      context.beginPath();
      context.moveTo(centerX, startY);
      context.lineTo(startX + inner, centerY);
      context.lineTo(centerX, startY + inner);
      context.lineTo(startX, centerY);
      context.closePath();
      context.fill();
      return;

    case "leaf":
      context.beginPath();
      context.moveTo(startX, startY);
      context.quadraticCurveTo(startX + inner, startY, startX + inner, startY + inner);
      context.quadraticCurveTo(startX, startY + inner, startX, startY);
      context.closePath();
      context.fill();
      return;

    case "stripe":
      for (let i = 0; i < 3; i += 1) {
        context.fillRect(
          startX + i * moduleSize + moduleSize * 0.15,
          startY,
          moduleSize * 0.7,
          inner,
        );
      }
      return;

    case "square":
    default:
      context.fillRect(startX, startY, inner, inner);
  }
};

const drawStyledQr = (
  canvas: HTMLCanvasElement,
  content: string,
  foregroundColor: string,
  backgroundColor: string,
  bodyShape: BodyShape,
  eyeFrame: EyeFrameShape,
  eyeBall: EyeBallShape,
  padding: number,
) => {
  const context = canvas.getContext("2d");
  if (!context || !content.length) {
    return;
  }

  canvas.width = 320;
  canvas.height = 320;

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = backgroundColor;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const modules = 32;
  const safePadding = Math.max(8, Math.min(56, padding));
  const drawableSize = canvas.width - safePadding * 2;
  const moduleSize = drawableSize / modules;

  context.fillStyle = foregroundColor;

  for (let row = 0; row < modules; row += 1) {
    for (let column = 0; column < modules; column += 1) {
      if (isFinderZone(row, column, modules)) {
        continue;
      }

      const charCode = content.charCodeAt((row + column) % content.length);
      const hash = (charCode * (row + 3) * (column + 5) + row * 11 + column * 7) % 7;

      if (hash === 0 || hash === 1 || hash === 3) {
        drawBodyModule({
          context,
          x: safePadding + column * moduleSize,
          y: safePadding + row * moduleSize,
          size: moduleSize,
          pattern: bodyShape,
          row,
          column,
        });
      }
    }
  }

  const positions = [
    { x: safePadding, y: safePadding },
    { x: safePadding + (modules - 7) * moduleSize, y: safePadding },
    { x: safePadding, y: safePadding + (modules - 7) * moduleSize },
  ];

  for (const position of positions) {
    drawEyeFrame({
      context,
      x: position.x,
      y: position.y,
      moduleSize,
      foregroundColor,
      backgroundColor,
      shape: eyeFrame,
    });

    drawEyeBall({
      context,
      x: position.x,
      y: position.y,
      moduleSize,
      foregroundColor,
      shape: eyeBall,
    });
  }
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
          typeof record.bodyShape === "string" &&
          isBodyShape(record.bodyShape) &&
          typeof record.eyeFrame === "string" &&
          isEyeFrameShape(record.eyeFrame) &&
          typeof record.eyeBall === "string" &&
          isEyeBallShape(record.eyeBall) &&
          typeof record.qrPadding === "number" &&
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

const getBodyShapeLabel = (value: BodyShape) =>
  BODY_SHAPE_OPTIONS.find((option) => option.value === value)?.label ?? value;

const getEyeFrameLabel = (value: EyeFrameShape) =>
  EYE_FRAME_OPTIONS.find((option) => option.value === value)?.label ?? value;

const getEyeBallLabel = (value: EyeBallShape) =>
  EYE_BALL_OPTIONS.find((option) => option.value === value)?.label ?? value;

const getRecordExportCount = (record: SavedQRCode) =>
  record.exports.png + record.exports.svg;

const PatternPreview = ({
  label,
  isSelected,
  onClick,
  draw,
}: {
  label: string;
  isSelected: boolean;
  onClick: () => void;
  draw: (ctx: CanvasRenderingContext2D, size: number) => void;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      return;
    }

    canvas.width = 40;
    canvas.height = 40;
    context.clearRect(0, 0, 40, 40);
    draw(context, 40);
  }, [draw]);

  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={cn(
        "relative flex flex-col items-center gap-1 rounded-xl border-2 p-1.5 transition-all duration-200 hover:scale-[1.03]",
        isSelected
          ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.08)] shadow-sm"
          : "border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:border-[hsl(var(--primary)/0.4)]",
      )}
    >
      <canvas ref={canvasRef} width={40} height={40} className="h-8 w-8" />
      <span className="text-[9px] font-medium leading-none text-[hsl(var(--muted-foreground))]">
        {label}
      </span>
      {isSelected ? (
        <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-[hsl(var(--background))] bg-[hsl(var(--primary))]" />
      ) : null}
    </button>
  );
};

function ContentSection({
  state,
  actions,
}: {
  state: BuilderState;
  actions: BuilderActions;
}) {
  return (
    <div className="space-y-5">
      <ToolSegmentedTabs
        options={Object.entries(QR_CONTENT_CONFIG).map(([value, config]) => ({
          value,
          label: config.label,
        }))}
        value={state.qrType}
        onValueChange={actions.onTypeChange}
      />

      <div className="grid gap-2">
        <Label htmlFor="qr-content">{state.selectedConfig.fieldLabel}</Label>
        <Input
          id="qr-content"
          type={state.selectedConfig.inputType}
          placeholder={state.selectedConfig.placeholder}
          value={state.content}
          onChange={(event) => actions.onContentChange(event.target.value)}
        />
      </div>

      <Button
        onClick={actions.onGenerate}
        disabled={state.isGenerating}
        className="w-full sm:w-auto"
      >
        {state.isGenerating ? (
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
  );
}

function StyleSection({
  state,
  actions,
  renderBodyPreview,
  renderEyeFramePreview,
  renderEyeBallPreview,
}: {
  state: BuilderState;
  actions: BuilderActions;
  renderBodyPreview: (option: BodyShape) => (ctx: CanvasRenderingContext2D, size: number) => void;
  renderEyeFramePreview: (option: EyeFrameShape) => (ctx: CanvasRenderingContext2D, size: number) => void;
  renderEyeBallPreview: (option: EyeBallShape) => (ctx: CanvasRenderingContext2D, size: number) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="grid gap-2">
          <Label htmlFor="qr-foreground">Foreground</Label>
          <div className="flex gap-3">
            <Input
              id="qr-foreground"
              type="color"
              value={state.foregroundColor}
              onChange={(event) => actions.onForegroundChange(event.target.value)}
              className="h-11 w-14 cursor-pointer p-1"
            />
            <Input
              value={state.foregroundColor.toUpperCase()}
              onChange={(event) => actions.onForegroundChange(event.target.value)}
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
              value={state.backgroundColor}
              onChange={(event) => actions.onBackgroundChange(event.target.value)}
              className="h-11 w-14 cursor-pointer p-1"
            />
            <Input
              value={state.backgroundColor.toUpperCase()}
              onChange={(event) => actions.onBackgroundChange(event.target.value)}
              className="font-mono"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-2">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="qr-padding">QR Padding</Label>
          <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
            {state.qrPadding}px
          </span>
        </div>

        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.18)] px-4 py-3">
          <input
            id="qr-padding"
            type="range"
            min={8}
            max={56}
            step={2}
            value={state.qrPadding}
            onChange={(event) => actions.onPaddingChange(Number(event.target.value))}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-[hsl(var(--border))]"
          />
        </div>
      </div>

      <div className="grid gap-2">
        <Label>Body Shape</Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {BODY_SHAPE_OPTIONS.map((option) => (
            <PatternPreview
              key={option.value}
              label={option.label}
              isSelected={state.bodyShape === option.value}
              onClick={() => actions.onBodyShapeChange(option.value)}
              draw={renderBodyPreview(option.value)}
            />
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="grid gap-2">
          <Label>Eye Frame</Label>
          <div className="grid grid-cols-3 gap-2">
            {EYE_FRAME_OPTIONS.map((option) => (
              <PatternPreview
                key={option.value}
                label={option.label}
                isSelected={state.eyeFrame === option.value}
                onClick={() => actions.onEyeFrameChange(option.value)}
                draw={renderEyeFramePreview(option.value)}
              />
            ))}
          </div>
        </div>

        <div className="grid gap-2">
          <Label>Eye Ball</Label>
          <div className="grid grid-cols-3 gap-2">
            {EYE_BALL_OPTIONS.map((option) => (
              <PatternPreview
                key={option.value}
                label={option.label}
                isSelected={state.eyeBall === option.value}
                onClick={() => actions.onEyeBallChange(option.value)}
                draw={renderEyeBallPreview(option.value)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function PreviewSection({
  canvasRef,
  qrGenerated,
  bodyShape,
  eyeFrame,
  eyeBall,
  foregroundColor,
  backgroundColor,
  qrPadding,
  selectedConfig,
  trimmedContent,
  isSaving,
  actions,
}: PreviewState & {
  actions: BuilderActions;
}) {
  return (
    <div className="space-y-5">
      <ToolPreviewFrame innerClassName="aspect-square w-full max-w-[420px]">
        <div className="mx-auto flex h-full w-full items-center justify-center rounded-[24px] border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-6 shadow-sm">
          <canvas
            ref={canvasRef}
            width={320}
            height={320}
            className={cn(
              "h-auto w-full max-w-[320px] rounded-2xl transition-all duration-300",
              qrGenerated ? "opacity-100 scale-100" : "opacity-0 scale-95 absolute",
            )}
          />

          {!qrGenerated ? (
            <ToolEmptyState
              icon={QrCode}
              title="QR preview"
              description="Enter content and click Generate once. After that, style changes update live."
              className="min-h-0 w-full border-none bg-transparent p-0 shadow-none"
            />
          ) : null}
        </div>
      </ToolPreviewFrame>

      <ToolPillGroup>
        <ToolFeaturePill label={`Type: ${selectedConfig.label}`} />
        <ToolFeaturePill
          label={`Body: ${getBodyShapeLabel(bodyShape)}`}
        />
        <ToolFeaturePill
          label={`Frame: ${getEyeFrameLabel(eyeFrame)}`}
        />
        <ToolFeaturePill label={`Ball: ${getEyeBallLabel(eyeBall)}`} />
      </ToolPillGroup>

      <ToolPillGroup>
        <ToolFeaturePill label={`FG ${foregroundColor.toUpperCase()}`} />
        <ToolFeaturePill label={`BG ${backgroundColor.toUpperCase()}`} />
        <ToolFeaturePill label={`Padding: ${qrPadding}px`} />
      </ToolPillGroup>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.24)] p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
            Content Preview
          </p>
          <p className="mt-2 break-words text-sm text-[hsl(var(--foreground))]">
            {trimmedContent || "Nothing entered yet"}
          </p>
        </div>

        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.24)] p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
            Status
          </p>
          <p className="mt-2 text-sm text-[hsl(var(--foreground))]">
            {qrGenerated
              ? "Preview is ready and style changes now update live."
              : "Enter content and click Generate to render the QR preview."}
          </p>
        </div>
      </div>

      <ToolPillGroup>
        <Button
          variant="outline"
          onClick={actions.onCopyContent}
          disabled={!trimmedContent}
        >
          <Copy className="h-4 w-4" />
          Copy Content
        </Button>

        <Button
          variant="outline"
          onClick={() => actions.onDownload("png")}
          disabled={!qrGenerated}
        >
          <Download className="h-4 w-4" />
          PNG
        </Button>

        <Button
          variant="outline"
          onClick={() => actions.onDownload("svg")}
          disabled={!qrGenerated}
        >
          <Download className="h-4 w-4" />
          SVG
        </Button>
      </ToolPillGroup>

      <Button
        onClick={actions.onFinalize}
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
  );
}

function DesktopBuilderPreview({
  builderState,
  previewState,
  actions,
  renderBodyPreview,
  renderEyeFramePreview,
  renderEyeBallPreview,
}: {
  builderState: BuilderState;
  previewState: PreviewState;
  actions: BuilderActions;
  renderBodyPreview: (option: BodyShape) => (ctx: CanvasRenderingContext2D, size: number) => void;
  renderEyeFramePreview: (option: EyeFrameShape) => (ctx: CanvasRenderingContext2D, size: number) => void;
  renderEyeBallPreview: (option: EyeBallShape) => (ctx: CanvasRenderingContext2D, size: number) => void;
}) {
  return (
    <div className="hidden xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(380px,0.95fr)] xl:gap-6">
      <ToolPanel
        heading="Panel 1 · QR Builder"
        para="Choose content, customize colors, body style, eye frame, eye ball, and QR padding. Preview starts after Generate, then updates live."
        headerSlot={<ToolFeaturePill icon={Palette} label="Design controls" />}
      >
        <ToolPillGroup className="mb-5">
          <ToolFeaturePill icon={QrCode} label="Body shapes" />
          <ToolFeaturePill icon={Eye} label="Eye frame styles" />
          <ToolFeaturePill icon={Circle} label="Eye ball styles" />
        </ToolPillGroup>

        <div className="space-y-6">
          <ContentSection state={builderState} actions={actions} />
          <StyleSection
            state={builderState}
            actions={actions}
            renderBodyPreview={renderBodyPreview}
            renderEyeFramePreview={renderEyeFramePreview}
            renderEyeBallPreview={renderEyeBallPreview}
          />
        </div>
      </ToolPanel>

      <ToolPanel
        heading="Panel 2 · Preview & Finalize"
        para="Review your QR output, export the file, and finalize to save in the database."
        headerSlot={
          <ToolFeaturePill
            label={
              previewState.activeSavedQRCode
                ? `Active record: ${truncateValue(previewState.activeSavedQRCode.id, 8)}`
                : previewState.hasPreviewContent
                  ? "Ready to generate"
                  : "Waiting for content"
            }
          />
        }
      >
        <PreviewSection {...previewState} actions={actions} />
      </ToolPanel>
    </div>
  );
}

function MobileBuilderPreview({
  builderState,
  previewState,
  actions,
  renderBodyPreview,
  renderEyeFramePreview,
  renderEyeBallPreview,
}: {
  builderState: BuilderState;
  previewState: PreviewState;
  actions: BuilderActions;
  renderBodyPreview: (option: BodyShape) => (ctx: CanvasRenderingContext2D, size: number) => void;
  renderEyeFramePreview: (option: EyeFrameShape) => (ctx: CanvasRenderingContext2D, size: number) => void;
  renderEyeBallPreview: (option: EyeBallShape) => (ctx: CanvasRenderingContext2D, size: number) => void;
}) {
  return (
    <div className="space-y-6 xl:hidden">
      <ToolPanel
        heading="Panel 1 · Content"
        para="Add the QR content and generate the first preview."
        headerSlot={<ToolFeaturePill icon={QrCode} label="Generate first" />}
      >
        <ContentSection state={builderState} actions={actions} />
      </ToolPanel>

      <ToolPanel
        heading="Panel 2 · Preview"
        para="Review the QR output and export it."
        headerSlot={
          <ToolFeaturePill
            label={
              previewState.activeSavedQRCode
                ? `Active record: ${truncateValue(previewState.activeSavedQRCode.id, 8)}`
                : previewState.hasPreviewContent
                  ? "Ready to generate"
                  : "Waiting for content"
            }
          />
        }
      >
        <PreviewSection {...previewState} actions={actions} />
      </ToolPanel>

      <ToolPanel
        heading="Panel 3 · Styles"
        para="Adjust colors, padding, body shape, eye frame, and eye ball."
        headerSlot={<ToolFeaturePill icon={Palette} label="Style controls" />}
      >
        <StyleSection
          state={builderState}
          actions={actions}
          renderBodyPreview={renderBodyPreview}
          renderEyeFramePreview={renderEyeFramePreview}
          renderEyeBallPreview={renderEyeBallPreview}
        />
      </ToolPanel>
    </div>
  );
}

function SavedRecordsPanel({
  savedQRCodes,
  activeSavedId,
  onLoadSavedRecord,
  onSimulateClick,
}: {
  savedQRCodes: SavedQRCode[];
  activeSavedId: string | null;
  onLoadSavedRecord: (record: SavedQRCode) => void;
  onSimulateClick: (id: string) => void;
}) {
  const totalClicks = savedQRCodes.reduce((sum, record) => sum + record.clicks, 0);
  const totalExports = savedQRCodes.reduce(
    (sum, record) => sum + getRecordExportCount(record),
    0,
  );

  return (
    <ToolPanel
      heading="Saved QR Codes"
      para={
        savedQRCodes.length
          ? `${savedQRCodes.length} finalized record${savedQRCodes.length > 1 ? "s" : ""}. Expand a row for the full content, styling, and activity details.`
          : "Finalize a QR code from the preview panel and your saved records will appear here."
      }
      headerSlot={
        savedQRCodes.length ? (
          <ToolFeaturePill icon={QrCode} label={`${savedQRCodes.length} saved`} />
        ) : undefined
      }
    >
      {savedQRCodes.length ? (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <ToolMetricCard
              label="Saved"
              value={savedQRCodes.length}
              valueClassName="text-2xl"
            />
            <ToolMetricCard
              label="Tracked Clicks"
              value={totalClicks}
              valueClassName="text-2xl"
            />
            <ToolMetricCard
              label="Tracked Exports"
              value={totalExports}
              valueClassName="text-2xl"
            />
          </div>

          <div className="overflow-hidden rounded-[1.75rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
            <div className="hidden gap-4 border-b border-[hsl(var(--border))] px-5 py-3 md:grid md:grid-cols-[minmax(0,1.75fr)_110px_160px_140px_108px] xl:grid-cols-[minmax(0,1.9fr)_120px_180px_150px_116px]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground)/0.9)]">
                Content
              </p>
              <p className="text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground)/0.9)]">
                Type
              </p>
              <p className="text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground)/0.9)]">
                Created At
              </p>
              <p className="text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground)/0.9)]">
                Activity
              </p>
              <p className="text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground)/0.9)]">
                Action
              </p>
            </div>

            <ToolExpandableRows
              key={activeSavedId ?? "saved-qr-records"}
              initialOpenId={activeSavedId ?? savedQRCodes[0]?.id ?? null}
              items={savedQRCodes.map((record) => ({
                id: record.id,
                trigger: (
                  <div
                    className={cn(
                      "grid gap-3 p-4 max-[350px]:gap-2 max-[350px]:p-3 md:items-center md:grid-cols-[minmax(0,1.75fr)_110px_160px_140px_108px] xl:grid-cols-[minmax(0,1.9fr)_120px_180px_150px_116px]",
                      activeSavedId === record.id
                        ? "bg-[hsl(var(--secondary)/0.3)]"
                        : undefined,
                    )}
                  >
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground)/0.78)] md:hidden">
                        Content
                      </p>
                      <p className="break-all text-sm font-medium leading-5 text-[hsl(var(--foreground))] md:truncate md:break-normal">
                        {truncateValue(record.content, 92)}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <ToolFeaturePill
                          label={`Body: ${getBodyShapeLabel(record.bodyShape)}`}
                        />
                        {activeSavedId === record.id ? (
                          <ToolFeaturePill
                            icon={CheckCircle2}
                            label="Loaded in builder"
                          />
                        ) : null}
                      </div>
                    </div>

                    <div className="min-w-0 md:text-center">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground)/0.78)] md:hidden">
                        Type
                      </p>
                      <p className="text-sm font-semibold text-[hsl(var(--foreground))]">
                        {QR_CONTENT_CONFIG[record.type].label}
                      </p>
                    </div>

                    <div className="min-w-0 md:text-center">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground)/0.78)] md:hidden">
                        Created At
                      </p>
                      <p className="text-sm text-[hsl(var(--foreground))]">
                        {formatDateTime(record.createdAt)}
                      </p>
                    </div>

                    <div className="min-w-0 md:text-center">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground)/0.78)] md:hidden">
                        Activity
                      </p>
                      <p className="text-sm font-semibold text-[hsl(var(--foreground))]">
                        {record.clicks} clicks
                      </p>
                      <p className="text-xs text-[hsl(var(--muted-foreground)/0.82)]">
                        {getRecordExportCount(record)} exports
                      </p>
                    </div>

                    <div className="min-w-0 md:justify-self-center">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground)/0.78)] md:hidden">
                        Action
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onLoadSavedRecord(record)}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Load
                      </Button>
                    </div>
                  </div>
                ),
                content: (
                  <div className="pb-4 max-[350px]:pb-3">
                    <div className="rounded-b-2xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.34)] p-4 max-[350px]:p-3">
                      <div className="grid gap-3 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,0.85fr)_minmax(0,1fr)_minmax(0,0.85fr)]">
                        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3.5 max-[350px]:px-3 max-[350px]:py-3">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground)/0.9)]">
                            Full Content
                          </p>
                          <p className="mt-2 break-all text-xs leading-5 text-[hsl(var(--foreground))]">
                            {record.content}
                          </p>
                        </div>

                        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3.5 max-[350px]:px-3 max-[350px]:py-3">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground)/0.9)]">
                            Colors
                          </p>
                          <div className="mt-2 space-y-2 text-xs text-[hsl(var(--foreground))]">
                            <p>Foreground: {record.foregroundColor.toUpperCase()}</p>
                            <p>Background: {record.backgroundColor.toUpperCase()}</p>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3.5 max-[350px]:px-3 max-[350px]:py-3">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground)/0.9)]">
                            Styling
                          </p>
                          <div className="mt-2 space-y-2 text-xs text-[hsl(var(--foreground))]">
                            <p>Body: {getBodyShapeLabel(record.bodyShape)}</p>
                            <p>Frame: {getEyeFrameLabel(record.eyeFrame)}</p>
                            <p>Ball: {getEyeBallLabel(record.eyeBall)}</p>
                            <p>Padding: {record.qrPadding}px</p>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3.5 max-[350px]:px-3 max-[350px]:py-3">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground)/0.9)]">
                            Activity
                          </p>
                          <div className="mt-2 space-y-2 text-xs text-[hsl(var(--foreground))]">
                            <p>Clicks: {record.clicks}</p>
                            <p>PNG exports: {record.exports.png}</p>
                            <p>SVG exports: {record.exports.svg}</p>
                            <p>Total exports: {getRecordExportCount(record)}</p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2.5">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onLoadSavedRecord(record)}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Load Into Builder
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => onSimulateClick(record.id)}
                        >
                          <MousePointerClick className="h-3.5 w-3.5" />
                          Add Click
                        </Button>
                      </div>
                    </div>
                  </div>
                ),
              }))}
            />
          </div>
        </div>
      ) : (
        <ToolEmptyState
          icon={QrCode}
          title="No saved QR codes yet"
          description="Finalize a generated QR code and the saved records list will appear here."
          className="min-h-[220px]"
        />
      )}
    </ToolPanel>
  );
}

function QRAnalyticsPanel({
  savedQRCodes,
  analytics,
}: {
  savedQRCodes: SavedQRCode[];
  analytics: AnalyticsState;
}) {
  return (
    <ToolPanel
      heading="QR Analytics"
      para="Review content mix, body-style usage, and the records generating the most activity."
      headerSlot={
        <ToolPillGroup>
          {savedQRCodes.length ? (
            <ToolFeaturePill
              icon={BarChart3}
              label={`${savedQRCodes.length} tracked`}
            />
          ) : null}
          <ToolFeaturePill
            icon={CalendarDays}
            label={
              analytics.latestRecord
                ? `Latest save ${formatDateTime(analytics.latestRecord.createdAt)}`
                : "Awaiting first finalized QR"
            }
          />
        </ToolPillGroup>
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
              label="Top Body Style"
              value={analytics.topBody}
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
              <p className="text-sm font-semibold">By Body Style</p>
              <div className="mt-4 space-y-3">
                {analytics.bodyDistribution.map((entry) => (
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
                              ? (entry.count / analytics.maxBodyCount) * 100
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

          <div className="grid gap-4 xl:grid-cols-2">
            <section className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.2)] p-4">
              <p className="text-sm font-semibold">Most Engaged Record</p>
              {analytics.topClickedRecord ? (
                <div className="mt-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
                  <p className="text-sm font-semibold text-[hsl(var(--foreground))]">
                    {truncateValue(analytics.topClickedRecord.content, 110)}
                  </p>
                  <ToolPillGroup className="mt-3">
                    <ToolFeaturePill
                      label={`Type: ${QR_CONTENT_CONFIG[analytics.topClickedRecord.type].label}`}
                    />
                    <ToolFeaturePill
                      label={`Clicks: ${analytics.topClickedRecord.clicks}`}
                    />
                    <ToolFeaturePill
                      label={`Exports: ${getRecordExportCount(analytics.topClickedRecord)}`}
                    />
                  </ToolPillGroup>
                  <p className="mt-3 text-xs text-[hsl(var(--muted-foreground)/0.82)]">
                    Created {formatDateTime(analytics.topClickedRecord.createdAt)}
                  </p>
                </div>
              ) : null}
            </section>

            <section className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.2)] p-4">
              <p className="text-sm font-semibold">Latest Saved Record</p>
              {analytics.latestRecord ? (
                <div className="mt-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
                  <p className="text-sm font-semibold text-[hsl(var(--foreground))]">
                    {truncateValue(analytics.latestRecord.content, 110)}
                  </p>
                  <ToolPillGroup className="mt-3">
                    <ToolFeaturePill
                      label={`Body: ${getBodyShapeLabel(analytics.latestRecord.bodyShape)}`}
                    />
                    <ToolFeaturePill
                      label={`Frame: ${getEyeFrameLabel(analytics.latestRecord.eyeFrame)}`}
                    />
                    <ToolFeaturePill
                      label={`Ball: ${getEyeBallLabel(analytics.latestRecord.eyeBall)}`}
                    />
                    <ToolFeaturePill
                      label={`Padding: ${analytics.latestRecord.qrPadding}px`}
                    />
                  </ToolPillGroup>
                  <p className="mt-3 text-xs text-[hsl(var(--muted-foreground)/0.82)]">
                    Saved {formatDateTime(analytics.latestRecord.createdAt)}
                  </p>
                </div>
              ) : null}
            </section>
          </div>
        </div>
      ) : (
        <ToolEmptyState
          icon={BarChart3}
          title="No analytics yet"
          description="Finalize a QR code from the preview panel, then click and export activity will appear here."
          className="min-h-[220px]"
        />
      )}
    </ToolPanel>
  );
}

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
  const [bodyShape, setBodyShape] = useState<BodyShape>("rounded");
  const [eyeFrame, setEyeFrame] = useState<EyeFrameShape>("rounded");
  const [eyeBall, setEyeBall] = useState<EyeBallShape>("rounded");
  const [qrPadding, setQrPadding] = useState(20);
  const [hasGeneratedOnce, setHasGeneratedOnce] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedQRCodes, setSavedQRCodes] = useState<SavedQRCode[]>(
    () => readStoredQRCodes(),
  );
  const [activeSavedId, setActiveSavedId] = useState<string | null>(null);

  const trimmedContent = content.trim();
  const hasPreviewContent = Boolean(trimmedContent);
  const qrGenerated = hasGeneratedOnce && hasPreviewContent;
  const selectedConfig = QR_CONTENT_CONFIG[qrType];

  const activeSavedQRCode = useMemo(
    () => savedQRCodes.find((record) => record.id === activeSavedId) ?? null,
    [savedQRCodes, activeSavedId],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const context = canvas.getContext("2d");
    if (!context) {
      return;
    }

    if (!hasGeneratedOnce || !trimmedContent) {
      canvas.width = 320;
      canvas.height = 320;
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      return;
    }

    drawStyledQr(
      canvas,
      trimmedContent,
      foregroundColor,
      backgroundColor,
      bodyShape,
      eyeFrame,
      eyeBall,
      qrPadding,
    );
  }, [
    hasGeneratedOnce,
    trimmedContent,
    foregroundColor,
    backgroundColor,
    bodyShape,
    eyeFrame,
    eyeBall,
    qrPadding,
  ]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(savedQRCodes));
  }, [savedQRCodes]);

  const analytics = useMemo<AnalyticsState>(() => {
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

    const bodyDistribution = BODY_SHAPE_OPTIONS.map((option) => ({
      ...option,
      count: savedQRCodes.filter((record) => record.bodyShape === option.value).length,
    }));

    const totalClicks = savedQRCodes.reduce((sum, record) => sum + record.clicks, 0);
    const totalExports = savedQRCodes.reduce(
      (sum, record) => sum + record.exports.png + record.exports.svg,
      0,
    );

    const topBodyRecord =
      [...bodyDistribution].sort((first, second) => second.count - first.count)[0] ??
      null;

    const topClickedRecord =
      [...savedQRCodes].sort(
        (firstRecord, secondRecord) =>
          secondRecord.clicks - firstRecord.clicks ||
          new Date(secondRecord.createdAt).getTime() -
            new Date(firstRecord.createdAt).getTime(),
      )[0] ?? null;

    return {
      typeDistribution,
      bodyDistribution,
      totalClicks,
      totalExports,
      maxTypeCount: Math.max(1, ...typeDistribution.map((entry) => entry.count)),
      maxBodyCount: Math.max(1, ...bodyDistribution.map((entry) => entry.count)),
      topBody:
        topBodyRecord && topBodyRecord.count > 0 ? topBodyRecord.label : "N/A",
      topClickedRecord,
      latestRecord: savedQRCodes[0] ?? null,
    };
  }, [savedQRCodes]);

  const handleTypeChange = (value: string) => {
    if (!isQRContentType(value)) {
      return;
    }

    setQrType(value);
    setContent("");
    setHasGeneratedOnce(false);
    setActiveSavedId(null);
  };

  const handleGenerate = async () => {
    if (!trimmedContent) {
      notify("Enter content for the QR code.", "warning");
      return;
    }

    setIsGenerating(true);
    await new Promise((resolve) => setTimeout(resolve, 250));
    setHasGeneratedOnce(true);
    setIsGenerating(false);
    notify("QR preview generated.", "success");
  };

  const handleFinalize = async () => {
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
      bodyShape,
      eyeFrame,
      eyeBall,
      qrPadding,
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
    if (!canvas || !qrGenerated) {
      notify("Generate the QR preview before export.", "warning");
      return;
    }

    const link = document.createElement("a");
    const fileNameStem =
      `linklab-qr-${qrType}-${bodyShape}-${eyeFrame}-${eyeBall}-p${qrPadding}`.replace(
        /\s+/g,
        "-",
      );

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
    setBodyShape(record.bodyShape);
    setEyeFrame(record.eyeFrame);
    setEyeBall(record.eyeBall);
    setQrPadding(record.qrPadding);
    setActiveSavedId(record.id);
    setHasGeneratedOnce(true);
    notify("Saved QR loaded into preview.", "info");
  };

  const renderBodyPreview = useCallback(
    (option: BodyShape) => (ctx: CanvasRenderingContext2D, size: number) => {
      ctx.fillStyle = foregroundColor;
      const scaled = size * 0.7;
      const offset = (size - scaled) / 2;
      const miniModule = scaled / 3;

      for (let row = 0; row < 3; row += 1) {
        for (let column = 0; column < 3; column += 1) {
          if ((row + column) % 2 === 0 || (row === 1 && column === 1)) {
            drawBodyModule({
              context: ctx,
              x: offset + column * miniModule,
              y: offset + row * miniModule,
              size: miniModule,
              pattern: option,
              row,
              column,
            });
          }
        }
      }
    },
    [foregroundColor],
  );

  const renderEyeFramePreview = useCallback(
    (option: EyeFrameShape) => (ctx: CanvasRenderingContext2D, size: number) => {
      const moduleSize = size / 7;
      drawEyeFrame({
        context: ctx,
        x: 0,
        y: 0,
        moduleSize,
        foregroundColor,
        backgroundColor,
        shape: option,
      });
    },
    [foregroundColor, backgroundColor],
  );

  const renderEyeBallPreview = useCallback(
    (option: EyeBallShape) => (ctx: CanvasRenderingContext2D, size: number) => {
      ctx.fillStyle = foregroundColor;
      const scaled = size * 0.7;
      const offset = (size - scaled) / 2;

      switch (option) {
        case "circle":
          ctx.beginPath();
          ctx.arc(size / 2, size / 2, scaled / 2, 0, Math.PI * 2);
          ctx.fill();
          return;

        case "rounded":
          drawRoundedRect(ctx, offset, offset, scaled, scaled, scaled * 0.25);
          return;

        case "diamond":
          ctx.beginPath();
          ctx.moveTo(size / 2, offset);
          ctx.lineTo(offset + scaled, size / 2);
          ctx.lineTo(size / 2, offset + scaled);
          ctx.lineTo(offset, size / 2);
          ctx.closePath();
          ctx.fill();
          return;

        case "leaf":
          ctx.beginPath();
          ctx.moveTo(offset, offset);
          ctx.quadraticCurveTo(offset + scaled, offset, offset + scaled, offset + scaled);
          ctx.quadraticCurveTo(offset, offset + scaled, offset, offset);
          ctx.closePath();
          ctx.fill();
          return;

        case "stripe":
          for (let i = 0; i < 3; i += 1) {
            ctx.fillRect(
              offset + i * (scaled / 3) + 1,
              offset,
              scaled / 3 - 2,
              scaled,
            );
          }
          return;

        case "square":
        default:
          ctx.fillRect(offset, offset, scaled, scaled);
      }
    },
    [foregroundColor],
  );

  const builderState: BuilderState = {
    qrType,
    content,
    foregroundColor,
    backgroundColor,
    bodyShape,
    eyeFrame,
    eyeBall,
    qrPadding,
    isGenerating,
    isSaving,
    qrGenerated,
    hasGeneratedOnce,
    trimmedContent,
    selectedConfig,
  };

  const previewState: PreviewState = {
    canvasRef,
    qrGenerated,
    hasPreviewContent,
    activeSavedQRCode,
    bodyShape,
    eyeFrame,
    eyeBall,
    foregroundColor,
    backgroundColor,
    qrPadding,
    selectedConfig,
    trimmedContent,
    isSaving,
  };

  const actions: BuilderActions = {
    onTypeChange: handleTypeChange,
    onContentChange: setContent,
    onForegroundChange: setForegroundColor,
    onBackgroundChange: setBackgroundColor,
    onBodyShapeChange: setBodyShape,
    onEyeFrameChange: setEyeFrame,
    onEyeBallChange: setEyeBall,
    onPaddingChange: setQrPadding,
    onGenerate: handleGenerate,
    onFinalize: handleFinalize,
    onCopyContent: handleCopyContent,
    onDownload: handleDownload,
  };

  return (
    <ToolPageShell
      icon={QrCode}
      heading="QR Code Generator"
      para="Design custom QR styles, preview changes live after generating once, finalize and save records, then monitor analytics in one place."
      iconClassName="h-6 w-6 text-primary"
    >
      <div className="space-y-6">
        <DesktopBuilderPreview
          builderState={builderState}
          previewState={previewState}
          actions={actions}
          renderBodyPreview={renderBodyPreview}
          renderEyeFramePreview={renderEyeFramePreview}
          renderEyeBallPreview={renderEyeBallPreview}
        />

        <MobileBuilderPreview
          builderState={builderState}
          previewState={previewState}
          actions={actions}
          renderBodyPreview={renderBodyPreview}
          renderEyeFramePreview={renderEyeFramePreview}
          renderEyeBallPreview={renderEyeBallPreview}
        />

        <SavedRecordsPanel
          savedQRCodes={savedQRCodes}
          activeSavedId={activeSavedId}
          onLoadSavedRecord={handleLoadSavedRecord}
          onSimulateClick={handleSimulateClick}
        />

        <QRAnalyticsPanel
          savedQRCodes={savedQRCodes}
          analytics={analytics}
        />
      </div>
    </ToolPageShell>
  );
};

export default QRGenerator;
