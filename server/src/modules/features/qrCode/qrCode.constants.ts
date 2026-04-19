import { QrExportType } from 'src/interfaces/features/qr-code.enums';

export const QR_PUBLIC_ID_LENGTH = 16;
export const QR_PUBLIC_ID_GENERATION_ATTEMPTS = 5;
export const QR_HEX_COLOR_REGEX = /^#(?:[A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/;
export const QR_WIFI_PREFIX_REGEX = /^WIFI:/i;
export const DEFAULT_QR_DASHBOARD_LIMIT = 20;
export const MAX_QR_DASHBOARD_LIMIT = 100;
export const QR_DASHBOARD_LATEST_SAVED_RECORDS_LIMIT = 5;
export const QR_COPY_COOLDOWN_SECONDS = 2 * 60;
export const QR_COPY_COOLDOWN_MS = QR_COPY_COOLDOWN_SECONDS * 1000;
export const QR_EXPORT_TOTAL_COUNT_ANALYTICS_FIELD = 'exportTotalCount';

export type QrExportCounterField =
  | 'png'
  | 'jpg'
  | 'jpeg'
  | 'svg'
  | 'webp'
  | 'pdf'
  | 'copy';

export const QR_EXPORT_TYPE_TO_COUNTER_FIELD: Record<
  QrExportType,
  QrExportCounterField
> = {
  [QrExportType.PNG]: 'png',
  [QrExportType.JPG]: 'jpg',
  [QrExportType.JPEG]: 'jpeg',
  [QrExportType.SVG]: 'svg',
  [QrExportType.WEBP]: 'webp',
  [QrExportType.PDF]: 'pdf',
  [QrExportType.COPY]: 'copy',
};

export const QR_EXPORT_TYPE_TO_ANALYTICS_COUNT_FIELD: Record<
  QrExportType,
  string
> = {
  [QrExportType.PNG]: 'exportPngCount',
  [QrExportType.JPG]: 'exportJpgCount',
  [QrExportType.JPEG]: 'exportJpegCount',
  [QrExportType.SVG]: 'exportSvgCount',
  [QrExportType.WEBP]: 'exportWebpCount',
  [QrExportType.PDF]: 'exportPdfCount',
  [QrExportType.COPY]: 'exportCopyCount',
};

export function createEmptyQrExportBreakdown(): Record<
  QrExportCounterField,
  number
> {
  return {
    png: 0,
    jpg: 0,
    jpeg: 0,
    svg: 0,
    webp: 0,
    pdf: 0,
    copy: 0,
  };
}

export function getQrCodeLookupKey(publicId: string): string {
  return `qr-code:lookup:${publicId}`;
}

export function getQrCodeAnalyticsKey(publicId: string): string {
  return `qr-code:analytics:${publicId}`;
}
