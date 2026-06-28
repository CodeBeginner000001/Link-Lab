export const BULK_BARCODE_MIN_ROWS = 5;
export const BULK_BARCODE_MAX_ROWS = 10_000;
export const BULK_BARCODE_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
export const BULK_BARCODE_ALLOWED_EXTENSIONS = [
  '.csv',
  '.xlsx',
  '.json',
] as const;
export const DEFAULT_BULK_BARCODE_PAGE_LIMIT = 10;
export const MAX_BULK_BARCODE_PAGE_LIMIT = 50;
