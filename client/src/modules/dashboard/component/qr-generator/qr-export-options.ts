import { QrExportType } from "@/service/dashboard/qr-generator/type";

export type QRExportOption = {
  value: QrExportType;
  label: string;
};

export const QR_EXPORT_OPTIONS: QRExportOption[] = [
  { value: "PNG", label: "PNG" },
  { value: "JPG", label: "JPG" },
  { value: "JPEG", label: "JPEG" },
  { value: "SVG", label: "SVG" },
  { value: "WEBP", label: "WEBP" },
  { value: "PDF", label: "PDF" },
  { value: "COPY", label: "COPY" },
];

export const QR_DOWNLOAD_EXPORT_OPTIONS: Array<{
  value: QrExportType;
  label: string;
}> = QR_EXPORT_OPTIONS.filter((option) => option.value !== "COPY");
