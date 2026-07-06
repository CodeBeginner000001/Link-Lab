import { BadRequestException, Injectable } from '@nestjs/common';

export type BulkBarcodeTemplateType = 'csv' | 'xlsx' | 'json';

type TemplateFile = {
  body: Buffer;
  contentType: string;
  filename: string;
};

const TEMPLATE_HEADERS = ['content', 'format', 'label'];
const TEMPLATE_ROWS = [
  ['123456789012', 'CODE128', 'Product 1'],
  ['987654321098', 'CODE128', 'Product 2'],
  ['ABC-2026-001', 'CODE128', 'Box A'],
  ['PRODUCT-004', 'CODE39', 'Item 4'],
  ['12345678901231', 'ITF14', 'Case 5'],
];

@Injectable()
export class BulkBarcodeTemplateService {
  getTemplate(type: string): TemplateFile {
    if (type === 'csv') {
      return {
        body: Buffer.from(this.buildCsv(), 'utf8'),
        contentType: 'text/csv; charset=utf-8',
        filename: 'bulk-barcode-template.csv',
      };
    }

    if (type === 'json') {
      return {
        body: Buffer.from(this.buildJson(), 'utf8'),
        contentType: 'application/json; charset=utf-8',
        filename: 'bulk-barcode-template.json',
      };
    }

    if (type === 'xlsx') {
      return {
        body: this.buildXlsx(),
        contentType:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        filename: 'bulk-barcode-template.xlsx',
      };
    }

    throw new BadRequestException({
      message: 'Template type must be csv, xlsx, or json',
      error: 'Bad Request',
    });
  }

  private buildCsv() {
    const rows = [TEMPLATE_HEADERS, ...TEMPLATE_ROWS];
    return rows.map((row) => row.map(this.escapeCsvCell).join(',')).join('\n');
  }

  private buildJson() {
    const rows = TEMPLATE_ROWS.map(([content, format, label]) => ({
      content,
      format,
      label,
    }));

    return JSON.stringify(rows, null, 2);
  }

  private buildXlsx() {
    const rows = [TEMPLATE_HEADERS, ...TEMPLATE_ROWS];
    const files = new Map<string, string>();

    files.set(
      '[Content_Types].xml',
      [
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
        '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
        '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>',
        '<Default Extension="xml" ContentType="application/xml"/>',
        '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>',
        '<Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>',
        '</Types>',
      ].join(''),
    );
    files.set(
      '_rels/.rels',
      [
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>',
        '</Relationships>',
      ].join(''),
    );
    files.set(
      'xl/workbook.xml',
      [
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
        '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">',
        '<sheets><sheet name="Bulk Barcodes" sheetId="1" r:id="rId1"/></sheets>',
        '</workbook>',
      ].join(''),
    );
    files.set(
      'xl/_rels/workbook.xml.rels',
      [
        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
        '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>',
        '</Relationships>',
      ].join(''),
    );
    files.set('xl/worksheets/sheet1.xml', this.buildWorksheetXml(rows));

    return createZip(files);
  }

  private buildWorksheetXml(rows: string[][]) {
    const sheetRows = rows
      .map((row, rowIndex) => {
        const rowNumber = rowIndex + 1;
        const cells = row
          .map((value, columnIndex) => {
            const ref = `${toColumnName(columnIndex + 1)}${rowNumber}`;
            return `<c r="${ref}" t="inlineStr"><is><t>${escapeXml(value)}</t></is></c>`;
          })
          .join('');

        return `<row r="${rowNumber}">${cells}</row>`;
      })
      .join('');

    return [
      '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
      '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">',
      `<sheetData>${sheetRows}</sheetData>`,
      '</worksheet>',
    ].join('');
  }

  private escapeCsvCell(value: string) {
    return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
  }
}

function toColumnName(column: number) {
  let value = column;
  let name = '';

  while (value > 0) {
    const remainder = (value - 1) % 26;
    name = String.fromCharCode(65 + remainder) + name;
    value = Math.floor((value - 1) / 26);
  }

  return name;
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function createZip(files: Map<string, string>) {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const [filename, contents] of files.entries()) {
    const name = Buffer.from(filename, 'utf8');
    const data = Buffer.from(contents, 'utf8');
    const crc = crc32(data);
    const localHeader = Buffer.alloc(30);

    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0, 6);
    localHeader.writeUInt16LE(0, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(data.length, 18);
    localHeader.writeUInt32LE(data.length, 22);
    localHeader.writeUInt16LE(name.length, 26);
    localHeader.writeUInt16LE(0, 28);

    localParts.push(localHeader, name, data);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0, 8);
    centralHeader.writeUInt16LE(0, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(data.length, 20);
    centralHeader.writeUInt32LE(data.length, 24);
    centralHeader.writeUInt16LE(name.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);
    centralParts.push(centralHeader, name);

    offset += localHeader.length + name.length + data.length;
  }

  const centralDirectoryOffset = offset;
  const centralDirectory = Buffer.concat(centralParts);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0);
  end.writeUInt16LE(0, 4);
  end.writeUInt16LE(0, 6);
  end.writeUInt16LE(files.size, 8);
  end.writeUInt16LE(files.size, 10);
  end.writeUInt32LE(centralDirectory.length, 12);
  end.writeUInt32LE(centralDirectoryOffset, 16);
  end.writeUInt16LE(0, 20);

  return Buffer.concat([...localParts, centralDirectory, end]);
}

function crc32(buffer: Buffer) {
  let crc = 0xffffffff;

  for (const byte of buffer) {
    crc ^= byte;
    for (let index = 0; index < 8; index += 1) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
}
