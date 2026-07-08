import { Injectable } from '@nestjs/common';
import { once } from 'events';
import PDFDocument from 'pdfkit';
import { PassThrough, Readable } from 'stream';
import {
  BulkBarcodeDocument,
  BulkBarcodeDownloadType,
  BulkBarcodeItem,
} from 'src/models/bulk-barcode.schema';
import { BarcodeRendererService } from '../barcodeGenerator/barcode-renderer.service';
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

type PdfBarcodeRender = {
  item: BulkBarcodeExportItem;
  png: Buffer;
  imageWidth: number;
  imageHeight: number;
};

type PdfLayout = {
  pageWidth: number;
  pageHeight: number;
  margin: number;
  columns: number;
  gap: number;
  cardWidth: number;
  cardPadding: number;
  maxBarcodeHeight: number;
};

type PdfCardFrame = {
  x: number;
  y: number;
  width: number;
  height: number;
  barcodeX: number;
  barcodeY: number;
  barcodeWidth: number;
  barcodeHeight: number;
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
      rowHeight = Math.max(rowHeight, this.getPdfCardHeight(render, layout));
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
    const gap = 3;
    const cardPadding = 3;
    const cardWidth = (pageWidth - margin * 2 - gap * (columns - 1)) / columns;

    return {
      pageWidth,
      pageHeight,
      margin,
      columns,
      gap,
      cardWidth,
      cardPadding,
      maxBarcodeHeight: 72,
    };
  }

  private drawPdfBarcodeRender(
    doc: PdfDocumentInstance,
    render: PdfBarcodeRender,
    layout: PdfLayout,
    x: number,
    y: number,
  ) {
    const frame = this.getPdfCardFrame(render, layout, x, y);

    this.drawPdfCardFrame(doc, frame);

    doc.image(render.png, frame.barcodeX, frame.barcodeY, {
      width: frame.barcodeWidth,
      height: frame.barcodeHeight,
    });
  }

  private getPdfBarcodeFit(
    render: PdfBarcodeRender,
    layout: PdfLayout,
  ): { width: number; height: number } {
    const maxWidth = layout.cardWidth - layout.cardPadding * 2;
    const maxHeight = layout.maxBarcodeHeight;
    const scale = Math.min(
      maxWidth / render.imageWidth,
      maxHeight / render.imageHeight,
      1,
    );

    return {
      width: render.imageWidth * scale,
      height: render.imageHeight * scale,
    };
  }

  private getPdfCardHeight(render: PdfBarcodeRender, layout: PdfLayout) {
    const fit = this.getPdfBarcodeFit(render, layout);
    return layout.cardPadding * 2 + fit.height;
  }

  private getPdfCardFrame(
    render: PdfBarcodeRender,
    layout: PdfLayout,
    x: number,
    y: number,
  ): PdfCardFrame {
    const fit = this.getPdfBarcodeFit(render, layout);
    const height = layout.cardPadding * 2 + fit.height;
    const barcodeX = x + (layout.cardWidth - fit.width) / 2;
    const barcodeY = y + layout.cardPadding;

    return {
      x,
      y,
      width: layout.cardWidth,
      height,
      barcodeX,
      barcodeY,
      barcodeWidth: fit.width,
      barcodeHeight: fit.height,
    };
  }

  private drawPdfCardFrame(doc: PdfDocumentInstance, frame: PdfCardFrame) {
    doc
      .lineWidth(0.4)
      .strokeColor('#dcdee8')
      .rect(frame.x, frame.y, frame.width, frame.height)
      .stroke();
  }

  private async buildPdfBarcodeImage(
    item: BulkBarcodeExportItem,
  ): Promise<PdfBarcodeRender> {
    const png = await this.getItemPng(item);
    const { width, height } = readPngSize(png);

    return {
      item,
      png,
      imageWidth: width,
      imageHeight: height,
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
}

function readPngSize(png: Buffer): { width: number; height: number } {
  if (
    png.length < 24 ||
    png.readUInt32BE(0) !== 0x89504e47 ||
    png.readUInt32BE(4) !== 0x0d0a1a0a
  ) {
    throw new Error('Invalid PNG barcode image');
  }

  return {
    width: png.readUInt32BE(16),
    height: png.readUInt32BE(20),
  };
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
