import { Injectable } from '@nestjs/common';
import { once } from 'events';
import PDFDocument from 'pdfkit';
import { PassThrough, Readable } from 'stream';
import {
  BulkBarcodeDocument,
  BulkBarcodeDownloadType,
  BulkBarcodeItem,
} from 'src/models/bulk-barcode.schema';
import {
  BarcodeRawSymbol,
  BarcodeRendererService,
} from '../barcodeGenerator/barcode-renderer.service';
import {
  BULK_BARCODE_PDF_IMAGE_BATCH_SIZE,
  BULK_BARCODE_ZIP_RENDER_CONCURRENCY,
} from './bulk-barcode-generator.constants';

type BulkBarcodeExportItem = Pick<
  BulkBarcodeItem,
  | 'row'
  | 'content'
  | 'format'
  | 'label'
  | 'barWidth'
  | 'height'
  | 'margin'
  | 'barColor'
  | 'backgroundColor'
  | 'showValue'
  | 'svg'
>;

type ExportFile = {
  stream: Readable;
  contentType: string;
  filename: string;
};

type PdfBarcodeImage = {
  item: BulkBarcodeExportItem;
  png: Buffer;
};

type PdfBarcodeRender =
  | {
      item: BulkBarcodeExportItem;
      png: Buffer;
    }
  | {
      item: BulkBarcodeExportItem;
      symbol: BarcodeRawSymbol;
    };

type PdfLayout = {
  pageWidth: number;
  pageHeight: number;
  margin: number;
  columns: number;
  gap: number;
  cardWidth: number;
  cardHeight: number;
  barcodeHeight: number;
};

type PdfCardFrame = {
  x: number;
  y: number;
  width: number;
  height: number;
  barcodeX: number;
  barcodeY: number;
};

type PdfDocumentInstance = InstanceType<typeof PDFDocument>;

@Injectable()
export class BulkBarcodeExportService {
  constructor(private readonly renderer: BarcodeRendererService) {}

  async buildExport(
    bulkBarcode: BulkBarcodeDocument,
    type: BulkBarcodeDownloadType,
    items: AsyncIterable<BulkBarcodeExportItem>,
  ): Promise<ExportFile> {
    if (type === BulkBarcodeDownloadType.PDF) {
      return {
        stream: this.openPdfStream(items),
        contentType: 'application/pdf',
        filename: this.buildFilename(bulkBarcode, type),
      };
    }

    return {
      stream: this.openZipStream(items),
      contentType: 'application/zip',
      filename: this.buildFilename(bulkBarcode, type),
    };
  }

  private openPdfStream(items: AsyncIterable<BulkBarcodeExportItem>) {
    const layout = this.getPdfLayout();
    const stream = new PassThrough();
    const doc = new PDFDocument({
      size: [layout.pageWidth, layout.pageHeight],
      margin: 0,
      autoFirstPage: true,
    });

    doc.pipe(stream);

    void this.writePdfStream(items, doc).then(
      () => {
        doc.end();
      },
      (error) => {
        doc.destroy();
        stream.destroy(error as Error);
      },
    );

    return stream;
  }

  private async writePdfStream(
    items: AsyncIterable<BulkBarcodeExportItem>,
    doc: PdfDocumentInstance,
  ) {
    const layout = this.getPdfLayout();
    doc.font('Helvetica');

    let row: PdfBarcodeRender[] = [];
    let rowHeight = 0;
    let cursorY = layout.margin;
    let batch: BulkBarcodeExportItem[] = [];

    const flushRow = () => {
      if (row.length === 0) {
        return;
      }

      if (cursorY + rowHeight > layout.pageHeight - layout.margin) {
        doc.addPage({ size: [layout.pageWidth, layout.pageHeight] });
        cursorY = layout.margin;
      }

      for (let index = 0; index < row.length; index += 1) {
        const render = row[index];
        const x = layout.margin + index * (layout.cardWidth + layout.gap);
        this.drawPdfBarcodeRender(doc, render, layout, x, cursorY);
      }

      cursorY += rowHeight + layout.gap;
      row = [];
      rowHeight = 0;
    };

    const queueRender = (render: PdfBarcodeRender) => {
      if (row.length >= layout.columns) {
        flushRow();
      }

      row.push(render);
      rowHeight = Math.max(rowHeight, this.getPdfCardHeight(render.item, layout));
    };

    const queueImageBatch = async (itemsBatch: BulkBarcodeExportItem[]) => {
      const images = await Promise.all(
        itemsBatch.map((item) => this.buildPdfBarcodeImage(item)),
      );

      for (const image of images) {
        queueRender(image);
      }
    };

    for await (const item of items) {
      if (!item.svg) {
        if (batch.length > 0) {
          await queueImageBatch(batch);
          batch = [];
        }

        queueRender({
          item,
          symbol: this.renderer.renderRawLinear({
            format: item.format,
            content: item.content,
            barWidth: item.barWidth,
            height: item.height,
            margin: item.margin,
            barColor: item.barColor,
            backgroundColor: item.backgroundColor,
            showValue: item.showValue,
          }),
        });
        continue;
      }

      batch.push(item);

      if (batch.length >= BULK_BARCODE_PDF_IMAGE_BATCH_SIZE) {
        await queueImageBatch(batch);
        batch = [];
      }
    }

    if (batch.length > 0) {
      await queueImageBatch(batch);
    }

    flushRow();
  }

  private getPdfLayout(): PdfLayout {
    const pageWidth = 612;
    const pageHeight = 792;
    const margin = 16;
    const columns = 6;
    const gap = 4;
    const cardWidth = (pageWidth - margin * 2 - gap * (columns - 1)) / columns;
    const cardHeight = 62;

    return {
      pageWidth,
      pageHeight,
      margin,
      columns,
      gap,
      cardWidth,
      cardHeight,
      barcodeHeight: 30,
    };
  }

  private drawPdfBarcodeRender(
    doc: PdfDocumentInstance,
    render: PdfBarcodeRender,
    layout: PdfLayout,
    x: number,
    y: number,
  ) {
    const item = render.item;
    const frame = this.getPdfCardFrame(item, layout, x, y);

    this.drawPdfCardFrame(doc, frame);
    this.drawPdfBarcodeBackground(doc, item, layout, frame);

    if ('png' in render) {
      doc.image(render.png, frame.barcodeX, frame.barcodeY, {
        width: layout.cardWidth - 16,
        height: layout.barcodeHeight,
      });
    } else {
      this.drawPdfRawBars(
        doc,
        render.symbol,
        item,
        layout,
        frame.barcodeX,
        item.showValue ? frame.barcodeY + 10 : frame.barcodeY,
      );
    }

    this.drawPdfEncodedValue(doc, item, layout, frame);
    this.drawPdfBarcodeText(doc, item, layout, frame);
  }

  private getPdfCardHeight(item: BulkBarcodeExportItem, layout: PdfLayout) {
    return item.showValue ? layout.cardHeight : layout.barcodeHeight + 16;
  }

  private getPdfCardFrame(
    item: BulkBarcodeExportItem,
    layout: PdfLayout,
    x: number,
    y: number,
  ): PdfCardFrame {
    const height = this.getPdfCardHeight(item, layout);
    const frameY = y;
    const barcodeY = item.showValue ? frameY + 22 : frameY + 8;

    return {
      x,
      y: frameY,
      width: layout.cardWidth,
      height,
      barcodeX: x + 8,
      barcodeY,
    };
  }

  private drawPdfCardFrame(doc: PdfDocumentInstance, frame: PdfCardFrame) {
    doc
      .lineWidth(0.4)
      .strokeColor('#dcdee8')
      .rect(frame.x, frame.y, frame.width, frame.height)
      .stroke();
  }

  private drawPdfRawBars(
    doc: PdfDocumentInstance,
    symbol: BarcodeRawSymbol,
    item: BulkBarcodeExportItem,
    layout: PdfLayout,
    x: number,
    y: number,
  ) {
    const moduleTotal = symbol.sbs.reduce((total, width) => total + width, 0);
    const barcodeWidth = layout.cardWidth - 16;
    const barcodeHeight = item.showValue
      ? layout.barcodeHeight - 10
      : layout.barcodeHeight;
    const moduleWidth = barcodeWidth / moduleTotal;
    const barColor = this.toPdfHex(item.barColor);
    let cursor = x;

    symbol.sbs.forEach((width, index) => {
      const segmentWidth = width * moduleWidth;

      if (index % 2 === 0) {
        doc
          .fillColor(barColor)
          .rect(cursor, y, Math.max(segmentWidth, 0.35), barcodeHeight)
          .fill();
      }

      cursor += segmentWidth;
    });
  }

  private drawPdfBarcodeBackground(
    doc: PdfDocumentInstance,
    item: BulkBarcodeExportItem,
    layout: PdfLayout,
    frame: PdfCardFrame,
  ) {
    doc
      .fillColor(this.toPdfHex(item.backgroundColor))
      .rect(
        frame.barcodeX,
        frame.barcodeY,
        layout.cardWidth - 16,
        layout.barcodeHeight,
      )
      .fill();
  }

  private drawPdfEncodedValue(
    doc: PdfDocumentInstance,
    item: BulkBarcodeExportItem,
    layout: PdfLayout,
    frame: PdfCardFrame,
  ) {
    if (!item.showValue) {
      return;
    }

    doc
      .fillColor(this.toPdfHex(item.barColor))
      .fontSize(5)
      .text(truncatePdfText(item.content, 36), frame.barcodeX, frame.barcodeY + 1, {
        width: layout.cardWidth - 16,
        lineBreak: false,
      });
  }

  private drawPdfBarcodeText(
    doc: PdfDocumentInstance,
    item: BulkBarcodeExportItem,
    layout: PdfLayout,
    frame: PdfCardFrame,
  ) {
    if (!item.showValue) {
      return;
    }

    const label = this.getPdfDisplayLabel(item);
    const textColor = this.toPdfHex(item.barColor);

    if (label) {
      doc
        .fillColor(textColor)
        .fontSize(6)
        .text(label, frame.barcodeX, frame.y + 8, {
          width: layout.cardWidth - 16,
          lineBreak: false,
        });
    }

    doc
      .fillColor(textColor)
      .fontSize(6)
      .text(item.format, frame.barcodeX, frame.y + frame.height - 14, {
        width: layout.cardWidth - 16,
        lineBreak: false,
      });
  }

  private async buildPdfBarcodeImage(
    item: BulkBarcodeExportItem,
  ): Promise<PdfBarcodeImage> {
    return {
      item,
      png: await this.getItemPng(item),
    };
  }

  private openZipStream(items: AsyncIterable<BulkBarcodeExportItem>) {
    const stream = new PassThrough();

    void this.writeZipStream(items, stream).catch((error) => {
      stream.destroy(error as Error);
    });

    return stream;
  }

  private async writeZipStream(
    items: AsyncIterable<BulkBarcodeExportItem>,
    stream: PassThrough,
  ) {
    const centralParts: Buffer[] = [];
    const summaryParts: Buffer[] = [
      Buffer.from('row,content,format,label,fileName,status\n', 'utf8'),
    ];
    let offset = 0;
    let fileCount = 0;
    let pendingBatch: BulkBarcodeExportItem[] = [];

    const flushRenderedBatch = async (
      renderedItems: Array<{ item: BulkBarcodeExportItem; data: Buffer }>,
    ) => {
      for (const { item, data } of renderedItems) {
        const filename = this.buildItemFilename(item);
        const entry = createZipEntry(`barcodes/${filename}`, data, offset);
        centralParts.push(entry.centralHeader, entry.name);
        offset += entry.size;
        fileCount += 1;

        await writeZipChunk(stream, entry.localHeader);
        await writeZipChunk(stream, entry.name);
        await writeZipChunk(stream, data);

        summaryParts.push(
          Buffer.from(
            [
              item.row,
              item.content,
              item.format,
              item.label ?? '',
              filename,
              'success',
            ]
              .map((value) => this.escapeCsvCell(String(value)))
              .join(',') + '\n',
            'utf8',
          ),
        );
      }
    };

    const renderZipBatch = async (batch: BulkBarcodeExportItem[]) => {
      const renderedItems: Array<{ item: BulkBarcodeExportItem; data: Buffer }> =
        [];

      for (
        let index = 0;
        index < batch.length;
        index += BULK_BARCODE_ZIP_RENDER_CONCURRENCY
      ) {
        const slice = batch.slice(
          index,
          index + BULK_BARCODE_ZIP_RENDER_CONCURRENCY,
        );
        const renderedSlice = await Promise.all(
          slice.map(async (item) => ({
            item,
            data: Buffer.from(this.getItemSvg(item), 'utf8'),
          })),
        );

        renderedItems.push(...renderedSlice);
      }

      await flushRenderedBatch(renderedItems);
    };

    try {
      for await (const item of items) {
        pendingBatch.push(item);

        if (pendingBatch.length >= BULK_BARCODE_ZIP_RENDER_CONCURRENCY) {
          await renderZipBatch(pendingBatch);
          pendingBatch = [];
        }
      }

      if (pendingBatch.length > 0) {
        await renderZipBatch(pendingBatch);
      }

      const summary = Buffer.concat(summaryParts);
      const summaryEntry = createZipEntry('summary.csv', summary, offset);
      centralParts.push(summaryEntry.centralHeader, summaryEntry.name);
      offset += summaryEntry.size;
      fileCount += 1;

      await writeZipChunk(stream, summaryEntry.localHeader);
      await writeZipChunk(stream, summaryEntry.name);
      await writeZipChunk(stream, summary);

      const centralDirectoryOffset = offset;
      const centralDirectory = Buffer.concat(centralParts);
      const end = Buffer.alloc(22);
      end.writeUInt32LE(0x06054b50, 0);
      end.writeUInt16LE(0, 4);
      end.writeUInt16LE(0, 6);
      end.writeUInt16LE(fileCount, 8);
      end.writeUInt16LE(fileCount, 10);
      end.writeUInt32LE(centralDirectory.length, 12);
      end.writeUInt32LE(centralDirectoryOffset, 16);
      end.writeUInt16LE(0, 20);

      await writeZipChunk(stream, centralDirectory);
      await writeZipChunk(stream, end);
      stream.end();
    } catch (error) {
      stream.destroy(error as Error);
    }
  }

  private buildFilename(
    bulkBarcode: BulkBarcodeDocument,
    type: BulkBarcodeDownloadType,
  ) {
    return `bulk-barcodes-${String(bulkBarcode._id)}.${type}`;
  }

  private buildItemFilename(item: BulkBarcodeExportItem) {
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

  private getPdfDisplayLabel(item: BulkBarcodeExportItem) {
    const label = item.label?.trim();

    if (!label || /^auto\s+\d+$/i.test(label)) {
      return null;
    }

    return truncatePdfText(label, 40);
  }

  private getItemSvg(item: BulkBarcodeExportItem) {
    return this.renderer.renderSvg({
      format: item.format,
      content: item.content,
      barWidth: item.barWidth,
      height: item.height,
      margin: item.margin,
      barColor: item.barColor,
      backgroundColor: item.backgroundColor,
      showValue: item.showValue,
    });
  }

  private async getItemPng(item: BulkBarcodeExportItem) {
    return this.renderer.renderPng({
      format: item.format,
      content: item.content,
      barWidth: item.barWidth,
      height: item.height,
      margin: item.margin,
      barColor: item.barColor,
      backgroundColor: item.backgroundColor,
      showValue: item.showValue,
    });
  }

  private toPdfHex(hexColor: string) {
    const normalized = hexColor.replace('#', '').trim();

    if (normalized.length !== 6) {
      return '#000000';
    }

    return `#${normalized}`;
  }
}

function truncatePdfText(value: string, maxLength: number) {
  return value.length > maxLength
    ? `${value.slice(0, maxLength - 1)}...`
    : value;
}

function createZipEntry(filename: string, data: Buffer, offset: number) {
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

  return {
    localHeader,
    centralHeader,
    name,
    size: localHeader.length + name.length + data.length,
  };
}

async function writeZipChunk(stream: PassThrough, chunk: Buffer) {
  if (!stream.write(chunk)) {
    await once(stream, 'drain');
  }
}

const CRC_TABLE = new Uint32Array(256);

for (let index = 0; index < CRC_TABLE.length; index += 1) {
  let crc = index;

  for (let bit = 0; bit < 8; bit += 1) {
    crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
  }

  CRC_TABLE[index] = crc >>> 0;
}

function crc32(buffer: Buffer) {
  let crc = 0xffffffff;

  for (let index = 0; index < buffer.length; index += 1) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buffer[index]) & 0xff];
  }

  return (crc ^ 0xffffffff) >>> 0;
}
