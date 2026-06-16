export enum BarcodeFormat {
  CODE128 = 'CODE128',
  EAN13 = 'EAN13',
  UPCA = 'UPCA',
  CODE39 = 'CODE39',
  ITF14 = 'ITF14',
}

export enum BarcodeDownloadType {
  SVG = 'svg',
  PNG = 'png',
}

export enum BarcodeStatus {
  ACTIVE = 'active',
  DELETED = 'deleted',
}

export enum BarcodeActivityPeriod {
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
}

export const DEFAULT_BARCODE_PAGE_LIMIT = 10;
export const MAX_BARCODE_PAGE_LIMIT = 50;

export const BARCODE_FORMATS = [
  {
    value: BarcodeFormat.CODE128,
    label: 'Code 128',
    description: 'General-purpose barcode for text and numbers.',
    contentRule: 'Any text up to 128 characters',
    input: {
      inputMode: 'text',
      placeholder: 'LINKLAB-2025',
      minLength: 1,
      maxLength: 128,
      pattern: '^.{1,128}$',
      uppercase: false,
    },
  },
  {
    value: BarcodeFormat.EAN13,
    label: 'EAN-13',
    description: 'Retail product barcode used internationally.',
    contentRule: '12 or 13 digits',
    input: {
      inputMode: 'numeric',
      placeholder: '5901234123457',
      minLength: 12,
      maxLength: 13,
      pattern: '^\\d{12,13}$',
      uppercase: false,
    },
  },
  {
    value: BarcodeFormat.UPCA,
    label: 'UPC-A',
    description: 'Retail product barcode commonly used in North America.',
    contentRule: '11 or 12 digits',
    input: {
      inputMode: 'numeric',
      placeholder: '012345678905',
      minLength: 11,
      maxLength: 12,
      pattern: '^\\d{11,12}$',
      uppercase: false,
    },
  },
  {
    value: BarcodeFormat.CODE39,
    label: 'Code 39',
    description: 'Alphanumeric barcode for inventory and industrial use.',
    contentRule: 'Uppercase letters, digits, space, and -.$/+%',
    input: {
      inputMode: 'text',
      placeholder: 'PRODUCT-001',
      minLength: 1,
      maxLength: 128,
      pattern: '^[0-9A-Z .$/+%-]+$',
      uppercase: true,
    },
  },
  {
    value: BarcodeFormat.ITF14,
    label: 'ITF-14',
    description: 'Shipping-container barcode for trade items.',
    contentRule: '13 or 14 digits',
    input: {
      inputMode: 'numeric',
      placeholder: '12345678901231',
      minLength: 13,
      maxLength: 14,
      pattern: '^\\d{13,14}$',
      uppercase: false,
    },
  },
] as const;

export const BARCODE_RENDERER_FORMAT: Record<BarcodeFormat, string> = {
  [BarcodeFormat.CODE128]: 'code128',
  [BarcodeFormat.EAN13]: 'ean13',
  [BarcodeFormat.UPCA]: 'upca',
  [BarcodeFormat.CODE39]: 'code39',
  [BarcodeFormat.ITF14]: 'itf14',
};
