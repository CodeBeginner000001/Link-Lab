import { getQrExportDownloadUrl } from "@/service/dashboard/qr-generator";
import { QrExportType } from "@/service/dashboard/qr-generator/type";
import { QrPreviewRenderConfig } from "./qr-preview-renderer";

const MOBILE_BROWSER_PATTERN = /Android|iPhone|iPad|iPod/i;

export const shouldUseNativeQrFileDownload = () => {
  if (typeof navigator === "undefined") {
    return false;
  }

  return MOBILE_BROWSER_PATTERN.test(navigator.userAgent);
};

export const startNativeQrFileDownload = (
  publicId: string,
  exportType: Exclude<QrExportType, "COPY">,
  render?: QrPreviewRenderConfig,
) => {
  const link = document.createElement("a");

  link.href = getQrExportDownloadUrl(publicId, exportType, render);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
