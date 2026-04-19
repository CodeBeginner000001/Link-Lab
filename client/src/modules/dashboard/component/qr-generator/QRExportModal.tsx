"use client";

import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";
import { ExportQrCode } from "@/service/dashboard/qr-generator";
import { QrCodeStyle } from "@/service/dashboard/qr-generator/type";
import { useToastNotification } from "@/utils/toast";
import { Copy, Download, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { QR_EXPORT_OPTIONS } from "./qr-export-options";
import {
  isQrShareDismissed,
  shareQrExportFile,
  shouldUseNativeQrFileDownload,
  startNativeQrFileDownload,
} from "./qr-file-download";
import { getQrPreviewRenderConfig } from "./qr-preview-renderer";
import QRExportTypeDropdown from "./QRExportTypeDropdown";

type QRExportModalProps = {
  publicId: string;
  content: string;
  style: QrCodeStyle;
  trigger: React.ReactNode;
  disabled?: boolean;
};

const downloadBlob = (
  blob: Blob,
  fallbackFileName: string,
  fileName?: string | null,
) => {
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = objectUrl;
  link.download = fileName ?? fallbackFileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => {
    URL.revokeObjectURL(objectUrl);
  }, 0);
};

export default function QRExportModal({
  publicId,
  content,
  style,
  trigger,
  disabled = false,
}: QRExportModalProps) {
  const router = useRouter();
  const notify = useToastNotification();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedExportType, setSelectedExportType] = useState<
    (typeof QR_EXPORT_OPTIONS)[number]["value"] | ""
  >("");
  const [isExporting, setIsExporting] = useState(false);

  const handleClose = () => {
    setSelectedExportType("");
    setIsOpen(false);
  };

  const handleExport = async () => {
    if (!selectedExportType) {
      return;
    }

    const render = getQrPreviewRenderConfig(style.zoom);

    try {
      setIsExporting(true);

      const result = await ExportQrCode(
        publicId,
        selectedExportType,
        render,
      );

      if ("error" in result) {
        notify(result.error, "error");
        return;
      }

      if (result.kind === "copy") {
        await navigator.clipboard.writeText(result.content);
        notify("QR content copied.", "success");
        router.refresh();
        handleClose();
        return;
      }

      if (shouldUseNativeQrFileDownload()) {
        const didShare = await shareQrExportFile(
          result.blob,
          `qr-${publicId}.${selectedExportType.toLowerCase()}`,
          result.filename,
        );

        if (didShare) {
          handleClose();
          return;
        }

        startNativeQrFileDownload(publicId, selectedExportType, render);
        notify("Opened export in a new tab.", "success");
        handleClose();
        return;
      }

      downloadBlob(
        result.blob,
        `qr-${publicId}.${selectedExportType.toLowerCase()}`,
        result.filename,
      );
      notify(`QR downloaded as ${selectedExportType}.`, "success");
      handleClose();
    } catch (error) {
      if (isQrShareDismissed(error)) {
        return;
      }

      notify("Unable to export QR code.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <span
        onClick={() => {
          if (!disabled) {
            setIsOpen(true);
          }
        }}
      >
        {trigger}
      </span>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-3 py-4 backdrop-blur-sm sm:px-4 sm:py-6">
          <button
            type="button"
            aria-label="Close export modal"
            onClick={handleClose}
            className="absolute inset-0"
          />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="qr-export-modal-title"
            className="relative z-10 w-full max-w-[20rem] rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 shadow-2xl sm:max-w-sm sm:p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--primary))]">
                  Export QR
                </p>
                <h3
                  id="qr-export-modal-title"
                  className="mt-2 text-base font-semibold text-[hsl(var(--foreground))] sm:text-lg"
                >
                  Choose export type
                </h3>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Close modal"
                onClick={handleClose}
                className="h-8 w-8 rounded-full text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--secondary))] hover:text-[hsl(var(--foreground))] sm:h-9 sm:w-9"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="mt-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.18)] p-3 sm:mt-5 sm:p-4">
              <p className="text-xs font-medium text-[hsl(var(--foreground))] sm:text-sm">
                Saved QR
              </p>
              <p className="mt-2 break-all text-sm font-semibold text-[hsl(var(--foreground))]">
                {content}
              </p>
            </div>

            <div className="mt-4 grid gap-2 sm:mt-5">
              <Label className="text-xs text-[hsl(var(--foreground))]">
                Export type
              </Label>
              <QRExportTypeDropdown
                value={selectedExportType}
                onChange={(value) => setSelectedExportType(value)}
                placeholder="Select export type"
                options={QR_EXPORT_OPTIONS}
              />
            </div>

            <div className="mt-5 flex flex-col-reverse gap-2.5 sm:mt-6 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                type="button"
                disabled={!selectedExportType || isExporting}
                onClick={handleExport}
              >
                {isExporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    {selectedExportType === "COPY" ? (
                      <Copy className="h-4 w-4" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    {selectedExportType === "COPY" ? "Copy" : "Download"}
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
