import { getQrExportDownloadUrl } from "@/service/dashboard/qr-generator";
import { QrFileExportType } from "@/service/dashboard/qr-generator/type";
import { QrPreviewRenderConfig } from "./qr-preview-renderer";

const MOBILE_BROWSER_PATTERN = /Android|iPhone|iPad|iPod/i;

export const shouldUseNativeQrFileDownload = () => {
  if (typeof navigator === "undefined") {
    return false;
  }

  return MOBILE_BROWSER_PATTERN.test(navigator.userAgent);
};

export const shareQrExportFile = async (
  blob: Blob,
  fallbackFileName: string,
  fileName?: string | null,
) => {
  if (
    typeof navigator === "undefined" ||
    typeof navigator.share !== "function" ||
    typeof File === "undefined"
  ) {
    return false;
  }

  const sharedFile = new File([blob], fileName ?? fallbackFileName, {
    type: blob.type || "application/octet-stream",
  });

  if (
    typeof navigator.canShare === "function" &&
    !navigator.canShare({ files: [sharedFile] })
  ) {
    return false;
  }

  await navigator.share({
    files: [sharedFile],
    title: sharedFile.name,
  });

  return true;
};

export const isQrShareDismissed = (error: unknown) => {
  return error instanceof DOMException && error.name === "AbortError";
};

export const startNativeQrFileDownload = (
  publicId: string,
  exportType: QrFileExportType,
  render?: QrPreviewRenderConfig,
) => {
  const downloadUrl = getQrExportDownloadUrl(publicId, exportType, render);
  const popup = window.open(downloadUrl, "_blank", "noopener,noreferrer");

  if (popup) {
    return;
  }

  const link = document.createElement("a");
  link.href = downloadUrl;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
