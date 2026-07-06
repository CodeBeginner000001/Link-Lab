import { BARCODE_FORMATS, BarcodeFormat } from './barcode-generator.constants';

type BarcodeContentRule = {
  pattern: RegExp;
  checkDigitPayloadLength?: number;
};

type PreparedBarcodeContent =
  | {
      success: true;
      content: string;
    }
  | {
      success: false;
      error: string;
    };

const BARCODE_CONTENT_RULES: Record<BarcodeFormat, BarcodeContentRule> = {
  [BarcodeFormat.CODE128]: {
    pattern: /^.{1,128}$/u,
  },

  [BarcodeFormat.EAN13]: {
    pattern: /^\d{13}$/,
    checkDigitPayloadLength: 12,
  },

  [BarcodeFormat.UPCA]: {
    pattern: /^\d{12}$/,
    checkDigitPayloadLength: 11,
  },

  [BarcodeFormat.CODE39]: {
    pattern: /^[0-9A-Z .$/+%-]+$/,
  },

  [BarcodeFormat.ITF14]: {
    pattern: /^\d{14}$/,
    checkDigitPayloadLength: 13,
  },
};

export function prepareBarcodeContent(
  format: BarcodeFormat,
  rawContent: string,
): PreparedBarcodeContent {
  const content = rawContent.trim();

  if (!content) {
    return {
      success: false,
      error: 'Barcode content is required',
    };
  }

  const rule = BARCODE_CONTENT_RULES[format];
  const finalContent = addMissingCheckDigit(content, rule);

  if (!rule.pattern.test(finalContent)) {
    return {
      success: false,
      error: getFormatErrorMessage(format),
    };
  }

  const checkDigitError = validateCheckDigit(format, finalContent, rule);

  if (checkDigitError) {
    return {
      success: false,
      error: checkDigitError,
    };
  }

  return {
    success: true,
    content: finalContent,
  };
}

function addMissingCheckDigit(
  content: string,
  rule: BarcodeContentRule,
): string {
  if (!rule.checkDigitPayloadLength) {
    return content;
  }

  const isOnlyDigits = /^\d+$/.test(content);
  const isMissingCheckDigit = content.length === rule.checkDigitPayloadLength;

  if (!isOnlyDigits || !isMissingCheckDigit) {
    return content;
  }

  const checkDigit = calculateGtinCheckDigit(content);

  return `${content}${checkDigit}`;
}

function validateCheckDigit(
  format: BarcodeFormat,
  content: string,
  rule: BarcodeContentRule,
): string | null {
  if (!rule.checkDigitPayloadLength) {
    return null;
  }

  const fullContentLength = rule.checkDigitPayloadLength + 1;

  if (content.length !== fullContentLength) {
    return null;
  }

  const payload = content.slice(0, -1);
  const expectedCheckDigit = calculateGtinCheckDigit(payload);
  const actualCheckDigit = Number(content.slice(-1));

  if (actualCheckDigit !== expectedCheckDigit) {
    return `${format} check digit is invalid. Expected ${expectedCheckDigit} for ${payload}.`;
  }

  return null;
}

function calculateGtinCheckDigit(payload: string): number {
  const sum = [...payload].reverse().reduce((total, digit, index) => {
    const weight = index % 2 === 0 ? 3 : 1;

    return total + Number(digit) * weight;
  }, 0);

  return (10 - (sum % 10)) % 10;
}

function getFormatErrorMessage(format: BarcodeFormat): string {
  const formatRule = BARCODE_FORMATS.find(
    (item) => item.value === format,
  )?.contentRule;

  return `Content is invalid for ${format}. Expected: ${formatRule}`;
}
