"use client";

import { ExportQrCode, CreateQrCode } from "@/service/dashboard/qr-generator";
import {
  QrFileExportType,
  QrCodeRecord,
} from "@/service/dashboard/qr-generator/type";
import { useToastNotification } from "@/utils/toast";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  QR_CONTENT_TYPE_FROM_API,
  QR_CONTENT_TYPE_TO_API,
  QRContentType,
  WiFiFormState,
} from "../../interface/qrGeneratorConfig";
import {
  QR_STYLE_DEFAULTS,
  QRStyleDraft,
} from "../../interface/qrGeneratorStyle";
import QRDesktopView from "./QRDesktopView";
import QRPhoneView from "./QRPhoneView";
import {
  DEFAULT_WIFI_FORM,
  getDraftContent,
  getEmptyBasicContentState,
  QRBasicContentState,
} from "./qr-builder.helpers";
import {
  isQrShareDismissed,
  shareQrExportFile,
  shouldUseNativeQrFileDownload,
  startNativeQrFileDownload,
} from "./qr-file-download";
import { getQrPreviewRenderConfig } from "./qr-preview-renderer";

type QRGeneratorClientProps = {
  initialType: QRContentType;
};

const readErrorMessage = (
  message: string[] | undefined,
  fallback: string,
) => message?.[0] ?? fallback;

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

export default function QRGeneratorClient({
  initialType,
}: QRGeneratorClientProps) {
  const notify = useToastNotification();
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [selectedType, setSelectedType] = useState<QRContentType>(initialType);
  const [contentByType, setContentByType] = useState<QRBasicContentState>(
    getEmptyBasicContentState,
  );
  const [wifiForm, setWifiForm] = useState<WiFiFormState>(DEFAULT_WIFI_FORM);
  const [style, setStyle] = useState<QRStyleDraft>(QR_STYLE_DEFAULTS);
  const [previewSource, setPreviewSource] = useState<"none" | "draft" | "saved">(
    "none",
  );
  const [savedPreview, setSavedPreview] = useState<QrCodeRecord | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const isLockedAfterSave = previewSource === "saved" && Boolean(savedPreview);

  const draftContent = useMemo(
    () => getDraftContent(selectedType, contentByType, wifiForm).trim(),
    [selectedType, contentByType, wifiForm],
  );

  const preview = useMemo(() => {
    if (previewSource === "saved" && savedPreview) {
      return {
        source: "saved" as const,
        content: savedPreview.content,
        contentType: QR_CONTENT_TYPE_FROM_API[savedPreview.contentType],
        style: savedPreview.style,
        savedPublicId: savedPreview.publicId,
      };
    }

    if (previewSource === "draft" && draftContent) {
      return {
        source: "draft" as const,
        content: draftContent,
        contentType: selectedType,
        style,
        savedPublicId: null,
      };
    }

    return {
      source: "none" as const,
      content: "",
      contentType: selectedType,
      style,
      savedPublicId: null,
    };
  }, [draftContent, previewSource, savedPreview, selectedType, style]);

  const resetBuilder = () => {
    setSelectedType(initialType);
    setContentByType(getEmptyBasicContentState());
    setWifiForm({ ...DEFAULT_WIFI_FORM });
    setStyle({ ...QR_STYLE_DEFAULTS });
    setSavedPreview(null);
    setPreviewSource("none");
    setIsExporting(false);
  };

  const handleTypeChange = (type: QRContentType) => {
    setSelectedType(type);
    setPreviewSource(savedPreview ? "saved" : "none");
  };

  const handleBasicContentChange = (
    type: keyof QRBasicContentState,
    value: string,
  ) => {
    setContentByType((current) => ({
      ...current,
      [type]: value,
    }));
  };

  const handleWifiFieldChange = (patch: Partial<WiFiFormState>) => {
    setWifiForm((current) => ({
      ...current,
      ...patch,
    }));
  };

  const handleStyleChange = (patch: Partial<QRStyleDraft>) => {
    setStyle((current) => ({
      ...current,
      ...patch,
    }));
  };

  const handleGenerate = () => {
    if (!draftContent) {
      notify("Enter content for the QR code.", "warning");
      return;
    }

    setPreviewSource("draft");
    notify("QR preview generated.", "success");
  };

  const handleSave = async () => {
    if (!draftContent || previewSource !== "draft") {
      notify("Generate the QR preview before saving.", "warning");
      return;
    }

    try {
      setIsSaving(true);

      const response = await CreateQrCode({
        contentType: QR_CONTENT_TYPE_TO_API[selectedType],
        content: draftContent,
        style,
      });

      if ("error" in response) {
        notify(
          readErrorMessage(response.error?.message, "Unable to save QR code."),
          "error",
        );
        return;
      }

      const createdQr = response.result.data.qrCode;
      setSavedPreview(createdQr);
      setPreviewSource("saved");
      notify(response.result.data.message, "success");
      startTransition(() => {
        router.refresh();
      });
    } catch {
      notify("Unable to save QR code.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyContent = async () => {
    if (!preview.content) {
      notify("Generate a preview first.", "warning");
      return;
    }

    try {
      if (previewSource === "saved" && savedPreview) {
        const result = await ExportQrCode(savedPreview.publicId, "COPY");

        if ("error" in result) {
          notify(result.error, "error");
          return;
        }

        if (result.kind !== "copy") {
          notify("Unable to copy QR content.", "error");
          return;
        }

        await navigator.clipboard.writeText(result.content);
        notify("QR content copied.", "success");
        startTransition(() => {
          router.refresh();
        });
        return;
      }

      await navigator.clipboard.writeText(preview.content);
      notify("QR content copied.", "success");
    } catch {
      notify("Unable to copy QR content.", "error");
    }
  };

  const handleExport = async (format: QrFileExportType) => {
    if (previewSource !== "saved" || !savedPreview) {
      notify("Save the QR before downloading it.", "warning");
      return;
    }

    const render = getQrPreviewRenderConfig(savedPreview.style.zoom);

    try {
      setIsExporting(true);

      const result = await ExportQrCode(
        savedPreview.publicId,
        format,
        render,
      );

      if ("error" in result) {
        notify(result.error, "error");
        return;
      }

      if (result.kind === "copy") {
        await navigator.clipboard.writeText(result.content);
        notify("QR content copied.", "success");
        return;
      }

      if (shouldUseNativeQrFileDownload()) {
        const didShare = await shareQrExportFile(
          result.blob,
          `qr-${savedPreview.publicId}.${format.toLowerCase()}`,
          result.filename,
        );

        if (didShare) {
          return;
        }

        startNativeQrFileDownload(savedPreview.publicId, format, render);
        notify("Opened export in a new tab.", "success");
        return;
      }

      downloadBlob(
        result.blob,
        `qr-${savedPreview.publicId}.${format.toLowerCase()}`,
        result.filename,
      );
      notify(`QR downloaded as ${format}.`, "success");
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      if (isQrShareDismissed(error)) {
        return;
      }

      notify("Unable to export QR code.", "error");
    } finally {
      setIsExporting(false);
    }
  };

  const builderProps = {
    selectedType,
    contentByType,
    wifiForm,
    style,
    canGenerate: Boolean(draftContent) && !isLockedAfterSave,
    isGenerating: false,
    isLocked: isLockedAfterSave,
    onTypeChange: handleTypeChange,
    onBasicContentChange: handleBasicContentChange,
    onWifiFieldChange: handleWifiFieldChange,
    onStyleChange: handleStyleChange,
    onGenerate: handleGenerate,
  };

  const previewProps = {
    preview,
    isSaving,
    isExporting,
    onCopyContent: handleCopyContent,
    onReset: resetBuilder,
    onSave: handleSave,
    onExport: handleExport,
  };

  return (
    <div className="space-y-6">
      <QRDesktopView builderProps={builderProps} previewProps={previewProps} />
      <QRPhoneView builderProps={builderProps} previewProps={previewProps} />
    </div>
  );
}
