import { Injectable } from '@nestjs/common';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import sharp from 'sharp';
import {
  BulkBarcodeDocument,
  BulkBarcodeDownloadType,
  BulkBarcodeItem,
} from 'src/models/bulk-barcode.schema';

type ExportFile = {
  body: Buffer;
  contentType: string;
  filename: string;
};

@Injectable()
export class BulkBarcodeExportService {
  async buildExport(
    bulkBarcode: BulkBarcodeDocument,
    type: BulkBarcodeDownloadType,
  ): Promise<ExportFile> {
    if (type === BulkBarcodeDownloadType.PDF) {
      return {
        body: await this.buildPdf(bulkBarcode.items),
        contentType: 'application/pdf',
        filename: this.buildFilename(bulkBarcode, type),
      };
    }

    return {
      body: this.buildZip(bulkBarcode.items),
      contentType: 'application/zip',
      filename: this.buildFilename(bulkBarcode, type),
    };
  }

  private async buildPdf(items: BulkBarcodeItem[]) {
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    const pageWidth = 612;
    const pageHeight = 792;
    const margin = 42;
    const cardHeight = 132;
    const imageWidth = 220;
    const imageHeight = 72;
    let page = pdf.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin - cardHeight;

    for (const item of items) {
      if (y < margin) {
        page = pdf.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin - cardHeight;
      }

      const png = await sharp(Buffer.from(item.svg, 'utf8')).png().toBuffer();
      const image = await pdf.embedPng(png);
      const label = item.label || item.content;

      page.drawRectangle({
        x: margin,
        y,
        width: pageWidth - margin * 2,
        height: cardHeight,
        borderColor: rgb(0.86, 0.88, 0.91),
        borderWidth: 1,
      });
      page.drawImage(image, {
        x: margin + 20,
        y: y + 42,
        width: imageWidth,
        height: imageHeight,
      });
      page.drawText(label, {
        x: margin + 270,
        y: y + 82,
        size: 12,
        font,
      });
      page.drawText(`${item.format} - ${item.content}`, {
        x: margin + 270,
        y: y + 60,
        size: 9,
        font,
        color: rgb(0.36, 0.39, 0.45),
      });

      y -= cardHeight + 16;
    }

    return Buffer.from(await pdf.save());
  }

  private buildZip(items: BulkBarcodeItem[]) {
    const files = new Map<string, Buffer>();
    const summary = [
      'row,content,format,label,fileName,status',
      ...items.map((item) => {
        const filename = this.buildItemFilename(item);
        files.set(`barcodes/${filename}`, Buffer.from(item.svg, 'utf8'));

        return [
          item.row,
          item.content,
          item.format,
          item.label ?? '',
          filename,
          'success',
        ]
          .map((value) => this.escapeCsvCell(String(value)))
          .join(',');
      }),
    ].join('\n');

    files.set('summary.csv', Buffer.from(summary, 'utf8'));

    return createZip(files);
  }

  private buildFilename(
    bulkBarcode: BulkBarcodeDocument,
    type: BulkBarcodeDownloadType,
  ) {
    return `bulk-barcodes-${String(bulkBarcode._id)}.${type}`;
  }

  private buildItemFilename(item: BulkBarcodeItem) {
    const safeName = (item.label || item.content || `row-${item.row}`)
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40);

    return `row-${item.row}-${safeName || 'barcode'}.svg`;
  }

  private escapeCsvCell(value: string) {
    return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
  }
}

function createZip(files: Map<string, Buffer>) {
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const [filename, data] of files.entries()) {
    const name = Buffer.from(filename, 'utf8');
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
