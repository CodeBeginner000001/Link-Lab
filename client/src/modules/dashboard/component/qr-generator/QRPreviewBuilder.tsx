"use client";

import { Button } from "@/components/ui/Button";
import {
  getBodyShapeLabel,
  getEyeBallLabel,
  getEyeFrameLabel,
  QRStyleDraft,
} from "@/modules/dashboard/interface/qrGeneratorStyle";
import { QrExportType } from "@/service/dashboard/qr-generator/type";
import { cn } from "@/utils/tailwindcss-merger";
import {
  Copy,
  Download,
  Loader2,
  QrCode,
  RotateCcw,
  Save,
} from "lucide-react";
import { useState } from "react";
import ToolEmptyState from "../common/ToolEmptyState";
import ToolFeaturePill from "../common/ToolFeaturePill";
import ToolPillGroup from "../common/ToolPillGroup";
import ToolPreviewFrame from "../common/ToolPreviewFrame";
import { QR_CONTENT_CONFIG, QRContentType } from "../../interface/qrGeneratorConfig";
import QRCanvasPreview from "./QRCanvasPreview";
import QRExportTypeDropdown from "./QRExportTypeDropdown";

type QRPreviewSource = "none" | "draft" | "saved";

type QRPreviewBuilderProps = {
  preview: {
    source: QRPreviewSource;
    content: string;
    contentType: QRContentType;
    style: QRStyleDraft;
    savedPublicId: string | null;
  };
  isSaving: boolean;
  isExporting: boolean;
  onCopyContent: () => Promise<void>;
  onReset: () => void;
  onSave: () => Promise<void>;
  onExport: (format: Exclude<QrExportType, "COPY">) => Promise<void>;
};

export default function QRPreviewBuilder({
  preview,
  isSaving,
  isExporting,
  onCopyContent,
  onReset,
  onSave,
  onExport,
}: QRPreviewBuilderProps) {
  const selectedConfig = QR_CONTENT_CONFIG[preview.contentType];
  const canSave = preview.source === "draft" && Boolean(preview.content);
  const canDownload =
    preview.source === "saved" && Boolean(preview.savedPublicId);
  const canReset = preview.source === "saved";
  const [selectedExportType, setSelectedExportType] = useState<
    Exclude<QrExportType, "COPY">
  >("PNG");
  const previewClassName = cn(
    "max-w-[320px] transition-all duration-300",
    preview.source === "none"
      ? "opacity-0 scale-95 absolute"
      : "opacity-100 scale-100",
  );

  return (
    <div className="space-y-5">
      <ToolPreviewFrame innerClassName="aspect-square w-full max-w-[420px]">
        <div className="mx-auto flex h-full w-full items-center justify-center rounded-[24px] border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-6 shadow-sm">
          <QRCanvasPreview
            content={preview.content}
            style={preview.style}
            size={320}
            className={previewClassName}
          />

          {preview.source === "none" ? (
            <ToolEmptyState
              icon={QrCode}
              title="QR preview"
              description="Generate a preview from the builder. Downloads unlock after a successful save."
              className="min-h-0 w-full border-none bg-transparent p-0 shadow-none"
            />
          ) : null}
        </div>
      </ToolPreviewFrame>

      <ToolPillGroup>
        <ToolFeaturePill label={`Type: ${selectedConfig.label}`} />
        <ToolFeaturePill label={`Body: ${getBodyShapeLabel(preview.style.bodyShape)}`} />
        <ToolFeaturePill
          label={`Frame: ${getEyeFrameLabel(preview.style.eyeFrameShape)}`}
        />
        <ToolFeaturePill
          label={`Ball: ${getEyeBallLabel(preview.style.eyeBallShape)}`}
        />
      </ToolPillGroup>

      <ToolPillGroup>
        <ToolFeaturePill label={`FG ${preview.style.foreground.toUpperCase()}`} />
        <ToolFeaturePill label={`BG ${preview.style.background.toUpperCase()}`} />
        <ToolFeaturePill label={`Zoom ${preview.style.zoom.toFixed(2)}x`} />
      </ToolPillGroup>

      <ToolPillGroup>
        <Button
          type="button"
          variant="outline"
          onClick={() => void onCopyContent()}
          disabled={!preview.content}
        >
          <Copy className="h-4 w-4" />
          Copy Content
        </Button>
      </ToolPillGroup>

      {preview.content ? (
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.18)] p-3">
          <div className="grid gap-2">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground)/0.85)]">
              Download Type
            </p>
            <QRExportTypeDropdown
              value={selectedExportType}
              onChange={(value) => {
                if (value !== "COPY") {
                  setSelectedExportType(value);
                }
              }}
              disabled={!canDownload}
            />
          </div>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              variant="outline"
              onClick={() => void onExport(selectedExportType)}
              disabled={!canDownload || isExporting}
              className="sm:min-w-[140px]"
            >
              {isExporting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              Download
            </Button>
          </div>
        </div>
      ) : null}

      {canSave || canReset ? (
        <Button
          type="button"
          onClick={() => {
            if (canSave) {
              void onSave();
              return;
            }

            onReset();
          }}
          className="w-full"
          disabled={canSave ? isSaving : false}
        >
          {canSave && isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : canReset ? (
            <>
              <RotateCcw className="h-4 w-4" />
              Reset
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              Save QR To Server
            </>
          )}
        </Button>
      ) : null}
    </div>
  );
}
