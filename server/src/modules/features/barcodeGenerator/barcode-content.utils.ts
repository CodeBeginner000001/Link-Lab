import { BARCODE_FORMATS, BarcodeFormat } from './barcode-generator.constants';

export function normalizeBarcodeContent(
  format: BarcodeFormat,
  content: string,
): string {
  const trimmedContent = content.trim();

  if (format === BarcodeFormat.EAN13 && /^\d{12}$/.test(trimmedContent)) {
    return `${trimmedContent}${calculateGtinCheckDigit(trimmedContent)}`;
  }

  if (format === BarcodeFormat.UPCA && /^\d{11}$/.test(trimmedContent)) {
    return `${trimmedContent}${calculateGtinCheckDigit(trimmedContent)}`;
  }

  if (format === BarcodeFormat.ITF14 && /^\d{13}$/.test(trimmedContent)) {
    return `${trimmedContent}${calculateGtinCheckDigit(trimmedContent)}`;
  }

  return trimmedContent;
}

export function getBarcodeContentValidationError(
  format: BarcodeFormat,
  content: string,
): string | null {
  if (!content) {
    return 'Barcode content is required';
  }

  const rules: Record<BarcodeFormat, RegExp> = {
    [BarcodeFormat.CODE128]: /^.{1,128}$/u,
    [BarcodeFormat.EAN13]: /^\d{12,13}$/,
    [BarcodeFormat.UPCA]: /^\d{11,12}$/,
    [BarcodeFormat.CODE39]: /^[0-9A-Z .$/+%-]+$/,
    [BarcodeFormat.ITF14]: /^\d{13,14}$/,
  };

  if (!rules[format].test(content)) {
    const formatRule = BARCODE_FORMATS.find(
      (item) => item.value === format,
    )?.contentRule;

    return `Content is invalid for ${format}. Expected: ${formatRule}`;
  }

  if (
    (format === BarcodeFormat.EAN13 && content.length === 13) ||
    (format === BarcodeFormat.UPCA && content.length === 12) ||
    (format === BarcodeFormat.ITF14 && content.length === 14)
  ) {
    const payload = content.slice(0, -1);
    const expectedCheckDigit = calculateGtinCheckDigit(payload);
    const actualCheckDigit = Number(content.slice(-1));

    if (actualCheckDigit !== expectedCheckDigit) {
      return `${format} check digit is invalid. Expected ${expectedCheckDigit} for ${payload}.`;
    }
  }

  return null;
}

function calculateGtinCheckDigit(payload: string): number {
  const sum = [...payload].reverse().reduce((total, digit, index) => {
    return total + Number(digit) * (index % 2 === 0 ? 3 : 1);
  }, 0);

  return (10 - (sum % 10)) % 10;
}
