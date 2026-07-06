import { BadRequestException, Injectable } from '@nestjs/common';
import { inflateRawSync } from 'zlib';

export type UploadedBarcodeFile = {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
};

export type ParsedBarcodeRow = {
  row: number;
  content: string;
  format: string;
  label?: string;
};

@Injectable()
export class BulkBarcodeParserService {
  parse(file: UploadedBarcodeFile): ParsedBarcodeRow[] {
    const extension = this.getExtension(file.originalname);

    if (extension === '.csv') {
      return this.parseCsv(file.buffer.toString('utf8'));
    }

    if (extension === '.json') {
      return this.parseJson(file.buffer.toString('utf8'));
    }

    if (extension === '.xlsx') {
      return this.parseXlsx(file.buffer);
    }

    throw new BadRequestException({
      message: 'Upload must be a CSV, XLSX, or JSON file',
      error: 'Bad Request',
    });
  }

  private parseCsv(contents: string): ParsedBarcodeRow[] {
    const lines = contents
      .replace(/^\uFEFF/, '')
      .split(/\r?\n/)
      .filter((line) => line.trim().length > 0);

    if (lines.length < 2) {
      return [];
    }

    const tableRows = lines.map((line) => this.parseCsvLine(line));
    return this.mapTableRows(tableRows);
  }

  private parseJson(contents: string): ParsedBarcodeRow[] {
    let value: unknown;

    try {
      value = JSON.parse(contents);
    } catch {
      throw new BadRequestException({
        message: 'JSON template must be valid JSON',
        error: 'Bad Request',
      });
    }

    const rows = Array.isArray(value)
      ? value
      : value &&
          typeof value === 'object' &&
          Array.isArray((value as { items?: unknown }).items)
        ? (value as { items: unknown[] }).items
        : null;

    if (!rows) {
      throw new BadRequestException({
        message:
          'JSON template must be an array or an object with an items array',
        error: 'Bad Request',
      });
    }

    return rows.map((item, index) => {
      const record =
        item && typeof item === 'object'
          ? (item as Record<string, unknown>)
          : {};
      const content =
        typeof record.content === 'string' || typeof record.content === 'number'
          ? String(record.content).trim()
          : '';
      const format =
        typeof record.format === 'string' || typeof record.format === 'number'
          ? String(record.format).trim().toUpperCase()
          : '';
      const label =
        record.label === undefined || record.label === null
          ? undefined
          : typeof record.label === 'string' || typeof record.label === 'number'
            ? String(record.label).trim()
            : undefined;

      return { row: index + 1, content, format, label };
    });
  }

  private parseXlsx(buffer: Buffer): ParsedBarcodeRow[] {
    const entries = readZip(buffer);
    const sheetXml = entries.get('xl/worksheets/sheet1.xml');

    if (!sheetXml) {
      throw new BadRequestException({
        message: 'XLSX template must include a first worksheet',
        error: 'Bad Request',
      });
    }

    const sharedStrings = this.parseSharedStrings(
      entries.get('xl/sharedStrings.xml')?.toString('utf8') ?? '',
    );
    const rows = this.parseWorksheet(sheetXml.toString('utf8'), sharedStrings);

    if (rows.length < 2) {
      return [];
    }

    return this.mapTableRows(rows);
  }

  private mapTableRows(rows: string[][]): ParsedBarcodeRow[] {
    const headers = rows[0].map((header) => header.trim().toLowerCase());
    const contentIndex = headers.indexOf('content');
    const formatIndex = headers.indexOf('format');
    const labelIndex = headers.indexOf('label');

    if (contentIndex === -1 || formatIndex === -1) {
      throw new BadRequestException({
        message: 'Upload must include content and format columns',
        error: 'Bad Request',
      });
    }

    return rows.slice(1).map((row, index) => ({
      row: index + 2,
      content: row[contentIndex]?.trim() ?? '',
      format: row[formatIndex]?.trim().toUpperCase() ?? '',
      label: labelIndex >= 0 ? row[labelIndex]?.trim() : undefined,
    }));
  }

  private parseWorksheet(xml: string, sharedStrings: string[]): string[][] {
    const rowMatches = xml.matchAll(/<row\b[^>]*>([\s\S]*?)<\/row>/g);
    const rows: string[][] = [];

    for (const rowMatch of rowMatches) {
      const rowCells: string[] = [];
      const cellMatches = rowMatch[1].matchAll(/<c\b([^>]*)>([\s\S]*?)<\/c>/g);

      for (const cellMatch of cellMatches) {
        const attributes = cellMatch[1];
        const body = cellMatch[2];
        const reference = /r="([A-Z]+)\d+"/.exec(attributes)?.[1];
        const columnIndex = reference
          ? columnNameToIndex(reference) - 1
          : rowCells.length;
        rowCells[columnIndex] = this.getCellValue(
          attributes,
          body,
          sharedStrings,
        );
      }

      rows.push(rowCells);
    }

    return rows;
  }

  private getCellValue(
    attributes: string,
    body: string,
    sharedStrings: string[],
  ): string {
    const type = /t="([^"]+)"/.exec(attributes)?.[1];

    if (type === 's') {
      const index = Number(/<v>([\s\S]*?)<\/v>/.exec(body)?.[1] ?? -1);
      return sharedStrings[index] ?? '';
    }

    const inlineText = /<is>[\s\S]*?<t[^>]*>([\s\S]*?)<\/t>[\s\S]*?<\/is>/.exec(
      body,
    )?.[1];

    if (inlineText !== undefined) {
      return decodeXml(inlineText);
    }

    return decodeXml(/<v>([\s\S]*?)<\/v>/.exec(body)?.[1] ?? '');
  }

  private parseSharedStrings(xml: string): string[] {
    if (!xml) {
      return [];
    }

    return [...xml.matchAll(/<si\b[^>]*>([\s\S]*?)<\/si>/g)].map((match) =>
      [...match[1].matchAll(/<t[^>]*>([\s\S]*?)<\/t>/g)]
        .map((textMatch) => decodeXml(textMatch[1]))
        .join(''),
    );
  }

  private parseCsvLine(line: string): string[] {
    const cells: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
      const character = line[index];
      const nextCharacter = line[index + 1];

      if (character === '"' && inQuotes && nextCharacter === '"') {
        current += '"';
        index += 1;
        continue;
      }

      if (character === '"') {
        inQuotes = !inQuotes;
        continue;
      }

      if (character === ',' && !inQuotes) {
        cells.push(current);
        current = '';
        continue;
      }

      current += character;
    }

    cells.push(current);
    return cells;
  }

  private getExtension(filename: string) {
    const lowerName = filename.trim().toLowerCase();
    const dotIndex = lowerName.lastIndexOf('.');

    return dotIndex >= 0 ? lowerName.slice(dotIndex) : '';
  }
}

function readZip(buffer: Buffer) {
  const entries = new Map<string, Buffer>();
  const directory = getCentralDirectory(buffer);
  let offset = directory.offset;

  while (
    offset + 46 <= buffer.length &&
    buffer.readUInt32LE(offset) === 0x02014b50
  ) {
    const compression = buffer.readUInt16LE(offset + 10);
    const compressedSize = buffer.readUInt32LE(offset + 20);
    const fileNameLength = buffer.readUInt16LE(offset + 28);
    const extraLength = buffer.readUInt16LE(offset + 30);
    const commentLength = buffer.readUInt16LE(offset + 32);
    const localHeaderOffset = buffer.readUInt32LE(offset + 42);
    const nameStart = offset + 46;
    const name = buffer
      .subarray(nameStart, nameStart + fileNameLength)
      .toString('utf8');
    const localNameLength = buffer.readUInt16LE(localHeaderOffset + 26);
    const localExtraLength = buffer.readUInt16LE(localHeaderOffset + 28);
    const dataStart =
      localHeaderOffset + 30 + localNameLength + localExtraLength;
    const dataEnd = dataStart + compressedSize;
    const data = buffer.subarray(dataStart, dataEnd);

    if (compression === 0) {
      entries.set(name, Buffer.from(data));
    } else if (compression === 8) {
      entries.set(name, inflateRawSync(data));
    }

    offset = nameStart + fileNameLength + extraLength + commentLength;
  }

  return entries;
}

function getCentralDirectory(buffer: Buffer) {
  for (let offset = buffer.length - 22; offset >= 0; offset -= 1) {
    if (buffer.readUInt32LE(offset) === 0x06054b50) {
      return {
        offset: buffer.readUInt32LE(offset + 16),
      };
    }
  }

  throw new BadRequestException({
    message: 'XLSX file is not a valid workbook',
    error: 'Bad Request',
  });
}

function columnNameToIndex(name: string) {
  return [...name].reduce(
    (value, character) => value * 26 + character.charCodeAt(0) - 64,
    0,
  );
}

function decodeXml(value: string) {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}
