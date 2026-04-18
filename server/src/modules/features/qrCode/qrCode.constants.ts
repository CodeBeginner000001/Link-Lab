import { QrExportType } from 'src/interfaces/features/qr-code.enums';

export const QR_PUBLIC_ID_LENGTH = 16;
export const QR_PUBLIC_ID_GENERATION_ATTEMPTS = 5;
export const QR_HEX_COLOR_REGEX = /^#(?:[A-Fa-f0-9]{3}|[A-Fa-f0-9]{6})$/;
export const QR_WIFI_PREFIX_REGEX = /^WIFI:/i;
export const DEFAULT_QR_DASHBOARD_LIMIT = 20;
export const MAX_QR_DASHBOARD_LIMIT = 100;
export const QR_DASHBOARD_LATEST_SAVED_RECORDS_LIMIT = 5;

export const QR_EXPORT_TYPE_TO_COUNTER_FIELD: Record<QrExportType, string> = {
  [QrExportType.PNG]: 'png',
  [QrExportType.JPG]: 'jpg',
  [QrExportType.JPEG]: 'jpeg',
  [QrExportType.SVG]: 'svg',
  [QrExportType.WEBP]: 'webp',
  [QrExportType.PDF]: 'pdf',
  [QrExportType.COPY]: 'copy',
};
