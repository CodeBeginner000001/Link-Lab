import { PDFDocument } from 'pdf-lib';
import QRCode from 'qrcode';
import sharp from 'sharp';
import {
  BodyShape,
  EyeBallShape,
  EyeFrameShape,
  QrExportType,
} from 'src/interfaces/features/qr-code.enums';
import type { QrCodeDocument } from 'src/models/qr-code.schema';

type QrStyle = QrCodeDocument['style'];

type QrExportBinaryPayload = {
  kind: 'binary';
  body: Buffer;
  contentType: string;
  filename: string;
};

type QrExportTextPayload = {
  kind: 'text';
  body: string;
  contentType: string;
  filename: string;
};

type QrExportJsonPayload = {
  kind: 'json';
  body: {
    exportType: QrExportType.COPY;
    content: string;
  };
};

export type QrExportPayload =
  | QrExportBinaryPayload
  | QrExportTextPayload
  | QrExportJsonPayload;

const QUIET_ZONE_MODULES = 4;
const FINDER_PATTERN_SIZE = 7;
const EYE_BALL_OFFSET = 2;
const EYE_BALL_SIZE = 3;
const BASE_CELL_SIZE = 12;

export async function buildQrExportPayload(params: {
  publicId: string;
  exportType: QrExportType;
  qrValue: string;
  style: QrStyle;
}): Promise<QrExportPayload> {
  const { publicId, exportType, qrValue, style } = params;
  const renderedSvg = renderStyledQrSvg(qrValue, style);
  const filenameBase = `qr-${publicId}`;

  switch (exportType) {
    case QrExportType.SVG:
      return {
        kind: 'text',
        body: renderedSvg.svg,
        contentType: 'image/svg+xml; charset=utf-8',
        filename: `${filenameBase}.svg`,
      };
    case QrExportType.PNG:
      return {
        kind: 'binary',
        body: await sharp(Buffer.from(renderedSvg.svg)).png().toBuffer(),
        contentType: 'image/png',
        filename: `${filenameBase}.png`,
      };
    case QrExportType.JPG:
      return {
        kind: 'binary',
        body: await sharp(Buffer.from(renderedSvg.svg))
          .jpeg({ quality: 92 })
          .toBuffer(),
        contentType: 'image/jpeg',
        filename: `${filenameBase}.jpg`,
      };
    case QrExportType.JPEG:
      return {
        kind: 'binary',
        body: await sharp(Buffer.from(renderedSvg.svg))
          .jpeg({ quality: 92 })
          .toBuffer(),
        contentType: 'image/jpeg',
        filename: `${filenameBase}.jpeg`,
      };
    case QrExportType.WEBP:
      return {
        kind: 'binary',
        body: await sharp(Buffer.from(renderedSvg.svg))
          .webp({ quality: 92 })
          .toBuffer(),
        contentType: 'image/webp',
        filename: `${filenameBase}.webp`,
      };
    case QrExportType.PDF:
      return {
        kind: 'binary',
        body: await buildPdfBuffer(renderedSvg.svg),
        contentType: 'application/pdf',
        filename: `${filenameBase}.pdf`,
      };
    case QrExportType.COPY:
      return {
        kind: 'json',
        body: {
          exportType: QrExportType.COPY,
          content: qrValue,
        },
      };
  }
}

function renderStyledQrSvg(
  qrValue: string,
  style: QrStyle,
): {
  svg: string;
} {
  const qr = QRCode.create(qrValue, {
    errorCorrectionLevel: 'M',
    margin: 0,
  });
  const moduleCount = qr.modules.size;
  const cellSize = Math.max(4, Math.round(BASE_CELL_SIZE * style.zoom));
  const canvasSize = (moduleCount + QUIET_ZONE_MODULES * 2) * cellSize;
  const offset = QUIET_ZONE_MODULES * cellSize;
  const bodyElements: string[] = [];

  for (let row = 0; row < moduleCount; row += 1) {
    for (let col = 0; col < moduleCount; col += 1) {
      if (!qr.modules.get(row, col)) {
        continue;
      }

      if (isFinderPatternModule(row, col, moduleCount)) {
        continue;
      }

      bodyElements.push(
        renderBodyModule({
          row,
          col,
          style,
          cellSize,
          offset,
          modules: qr.modules,
        }),
      );
    }
  }

  const eyeOrigins = [
    { row: 0, col: 0 },
    { row: 0, col: moduleCount - FINDER_PATTERN_SIZE },
    { row: moduleCount - FINDER_PATTERN_SIZE, col: 0 },
  ];

  const eyeElements = eyeOrigins.map((origin) =>
    renderEyePattern({
      row: origin.row,
      col: origin.col,
      style,
      cellSize,
      offset,
    }),
  );

  return {
    svg: `
      <svg xmlns="http://www.w3.org/2000/svg" width="${canvasSize}" height="${canvasSize}" viewBox="0 0 ${canvasSize} ${canvasSize}" role="img" aria-label="QR code" shape-rendering="geometricPrecision">
        <rect width="${canvasSize}" height="${canvasSize}" fill="${style.background}" />
        <g fill="${style.foreground}" stroke="${style.foreground}">
          ${bodyElements.join('')}
        </g>
        ${eyeElements.join('')}
      </svg>
    `.trim(),
  };
}

function isFinderPatternModule(
  row: number,
  col: number,
  moduleCount: number,
): boolean {
  const maxOrigin = moduleCount - FINDER_PATTERN_SIZE;

  return (
    (row < FINDER_PATTERN_SIZE && col < FINDER_PATTERN_SIZE) ||
    (row < FINDER_PATTERN_SIZE && col >= maxOrigin) ||
    (row >= maxOrigin && col < FINDER_PATTERN_SIZE)
  );
}

function renderBodyModule(params: {
  row: number;
  col: number;
  style: QrStyle;
  cellSize: number;
  offset: number;
  modules: {
    size: number;
    get: (row: number, col: number) => boolean | number;
  };
}): string {
  const { row, col, style, cellSize, offset, modules } = params;
  const x = offset + col * cellSize;
  const y = offset + row * cellSize;

  switch (style.bodyShape) {
    case BodyShape.SQUARE:
      return `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" />`;
    case BodyShape.DOTS:
      return `<circle cx="${x + cellSize / 2}" cy="${y + cellSize / 2}" r="${cellSize * 0.34}" />`;
    case BodyShape.ROUNDED:
      return `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" rx="${cellSize * 0.32}" ry="${cellSize * 0.32}" />`;
    case BodyShape.CLASSY:
      return buildSelectiveRoundedRect({
        x,
        y,
        size: cellSize,
        tl:
          !isDarkModule(modules, row, col - 1) &&
          !isDarkModule(modules, row - 1, col),
        tr:
          !isDarkModule(modules, row, col + 1) &&
          !isDarkModule(modules, row - 1, col),
        br:
          !isDarkModule(modules, row, col + 1) &&
          !isDarkModule(modules, row + 1, col),
        bl:
          !isDarkModule(modules, row, col - 1) &&
          !isDarkModule(modules, row + 1, col),
        radius: cellSize * 0.46,
      });
    case BodyShape.DIAMOND:
      return `<polygon points="${x + cellSize / 2},${y} ${x + cellSize},${y + cellSize / 2} ${x + cellSize / 2},${y + cellSize} ${x},${y + cellSize / 2}" />`;
    case BodyShape.HORIZONTAL:
      return `<rect x="${x}" y="${y + cellSize * 0.2}" width="${cellSize}" height="${cellSize * 0.6}" rx="${cellSize * 0.24}" ry="${cellSize * 0.24}" />`;
    case BodyShape.VERTICAL:
      return `<rect x="${x + cellSize * 0.2}" y="${y}" width="${cellSize * 0.6}" height="${cellSize}" rx="${cellSize * 0.24}" ry="${cellSize * 0.24}" />`;
    case BodyShape.STAR:
      return `<polygon points="${buildStarPoints(x + cellSize / 2, y + cellSize / 2, cellSize * 0.46, cellSize * 0.2, 4)}" />`;
    case BodyShape.MOSAIC:
      return `<rect x="${x + cellSize * 0.12}" y="${y + cellSize * 0.12}" width="${cellSize * 0.76}" height="${cellSize * 0.76}" rx="${cellSize * 0.08}" ry="${cellSize * 0.08}" />`;
    case BodyShape.ARROW:
      return `<polygon points="${x + cellSize * 0.08},${y + cellSize * 0.18} ${x + cellSize * 0.62},${y + cellSize * 0.18} ${x + cellSize * 0.62},${y + cellSize * 0.02} ${x + cellSize * 0.96},${y + cellSize * 0.5} ${x + cellSize * 0.62},${y + cellSize * 0.98} ${x + cellSize * 0.62},${y + cellSize * 0.82} ${x + cellSize * 0.08},${y + cellSize * 0.82} ${x + cellSize * 0.3},${y + cellSize * 0.5}" />`;
  }
}

function renderEyePattern(params: {
  row: number;
  col: number;
  style: QrStyle;
  cellSize: number;
  offset: number;
}): string {
  const { row, col, style, cellSize, offset } = params;
  const x = offset + col * cellSize;
  const y = offset + row * cellSize;
  const outerSize = FINDER_PATTERN_SIZE * cellSize;
  const innerSize = outerSize - cellSize * 2;
  const innerX = x + cellSize;
  const innerY = y + cellSize;
  const ballX = x + EYE_BALL_OFFSET * cellSize;
  const ballY = y + EYE_BALL_OFFSET * cellSize;
  const ballSize = EYE_BALL_SIZE * cellSize;
  const frame = renderEyeFrame({
    x,
    y,
    outerSize,
    innerX,
    innerY,
    innerSize,
    cellSize,
    shape: style.eyeFrameShape,
    foreground: style.foreground,
    background: style.background,
  });
  const eyeBall = renderEyeBall({
    x: ballX,
    y: ballY,
    size: ballSize,
    shape: style.eyeBallShape,
  });

  return `<g>${frame}${eyeBall}</g>`;
}

function renderEyeFrame(params: {
  x: number;
  y: number;
  outerSize: number;
  innerX: number;
  innerY: number;
  innerSize: number;
  cellSize: number;
  shape: EyeFrameShape;
  foreground: string;
  background: string;
}): string {
  const {
    x,
    y,
    outerSize,
    innerX,
    innerY,
    innerSize,
    cellSize,
    shape,
    foreground,
    background,
  } = params;

  switch (shape) {
    case EyeFrameShape.SQUARE:
      return `<rect x="${x}" y="${y}" width="${outerSize}" height="${outerSize}" fill="${foreground}" /><rect x="${innerX}" y="${innerY}" width="${innerSize}" height="${innerSize}" fill="${background}" />`;
    case EyeFrameShape.ROUNDED:
      return `<rect x="${x}" y="${y}" width="${outerSize}" height="${outerSize}" rx="${cellSize * 1.4}" ry="${cellSize * 1.4}" fill="${foreground}" /><rect x="${innerX}" y="${innerY}" width="${innerSize}" height="${innerSize}" rx="${cellSize}" ry="${cellSize}" fill="${background}" />`;
    case EyeFrameShape.CIRCLE:
      return `<circle cx="${x + outerSize / 2}" cy="${y + outerSize / 2}" r="${outerSize / 2}" fill="${foreground}" /><circle cx="${x + outerSize / 2}" cy="${y + outerSize / 2}" r="${innerSize / 2}" fill="${background}" />`;
    case EyeFrameShape.DOTTED:
      return buildDottedEyeFrame({
        x,
        y,
        cellSize,
        foreground,
      });
    case EyeFrameShape.INSET:
      return `<rect x="${x}" y="${y}" width="${outerSize}" height="${outerSize}" rx="${cellSize}" ry="${cellSize}" fill="${foreground}" /><rect x="${x + cellSize * 1.25}" y="${y + cellSize * 1.25}" width="${outerSize - cellSize * 2.5}" height="${outerSize - cellSize * 2.5}" rx="${cellSize * 0.7}" ry="${cellSize * 0.7}" fill="${background}" />`;
    case EyeFrameShape.SHIELD:
      return `${buildShieldPath(x, y, outerSize, foreground)}${buildShieldPath(innerX, innerY, innerSize, background)}`;
  }
}

function renderEyeBall(params: {
  x: number;
  y: number;
  size: number;
  shape: EyeBallShape;
}): string {
  const { x, y, size, shape } = params;

  switch (shape) {
    case EyeBallShape.SQUARE:
      return `<rect x="${x}" y="${y}" width="${size}" height="${size}" />`;
    case EyeBallShape.ROUNDED:
      return `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${size * 0.28}" ry="${size * 0.28}" />`;
    case EyeBallShape.CIRCLE:
      return `<circle cx="${x + size / 2}" cy="${y + size / 2}" r="${size / 2}" />`;
    case EyeBallShape.DIAMOND:
      return `<polygon points="${x + size / 2},${y} ${x + size},${y + size / 2} ${x + size / 2},${y + size} ${x},${y + size / 2}" />`;
    case EyeBallShape.LEAF:
      return `<path d="M ${x + size / 2} ${y} C ${x + size} ${y + size * 0.08}, ${x + size * 0.94} ${y + size * 0.92}, ${x + size / 2} ${y + size} C ${x + size * 0.06} ${y + size * 0.92}, ${x} ${y + size * 0.08}, ${x + size / 2} ${y} Z" />`;
    case EyeBallShape.STRIPE:
      return `
        <rect x="${x + size * 0.06}" y="${y}" width="${size * 0.2}" height="${size}" rx="${size * 0.08}" ry="${size * 0.08}" />
        <rect x="${x + size * 0.4}" y="${y}" width="${size * 0.2}" height="${size}" rx="${size * 0.08}" ry="${size * 0.08}" />
        <rect x="${x + size * 0.74}" y="${y}" width="${size * 0.2}" height="${size}" rx="${size * 0.08}" ry="${size * 0.08}" />
      `.trim();
  }
}

function buildSelectiveRoundedRect(params: {
  x: number;
  y: number;
  size: number;
  tl: boolean;
  tr: boolean;
  br: boolean;
  bl: boolean;
  radius: number;
}): string {
  const { x, y, size, tl, tr, br, bl, radius } = params;
  const tlr = tl ? radius : 0;
  const trr = tr ? radius : 0;
  const brr = br ? radius : 0;
  const blr = bl ? radius : 0;

  return `<path d="M ${x + tlr} ${y} H ${x + size - trr} ${trr > 0 ? `Q ${x + size} ${y} ${x + size} ${y + trr}` : `L ${x + size} ${y}`} V ${y + size - brr} ${brr > 0 ? `Q ${x + size} ${y + size} ${x + size - brr} ${y + size}` : `L ${x + size} ${y + size}`} H ${x + blr} ${blr > 0 ? `Q ${x} ${y + size} ${x} ${y + size - blr}` : `L ${x} ${y + size}`} V ${y + tlr} ${tlr > 0 ? `Q ${x} ${y} ${x + tlr} ${y}` : `L ${x} ${y}`} Z" />`;
}

function buildDottedEyeFrame(params: {
  x: number;
  y: number;
  cellSize: number;
  foreground: string;
}): string {
  const { x, y, cellSize, foreground } = params;
  const dotCoords = [
    [0.5, 0.5],
    [1.5, 0.5],
    [2.5, 0.5],
    [3.5, 0.5],
    [4.5, 0.5],
    [5.5, 0.5],
    [6.5, 0.5],
    [0.5, 1.5],
    [6.5, 1.5],
    [0.5, 2.5],
    [6.5, 2.5],
    [0.5, 3.5],
    [6.5, 3.5],
    [0.5, 4.5],
    [6.5, 4.5],
    [0.5, 5.5],
    [6.5, 5.5],
    [0.5, 6.5],
    [1.5, 6.5],
    [2.5, 6.5],
    [3.5, 6.5],
    [4.5, 6.5],
    [5.5, 6.5],
    [6.5, 6.5],
  ];

  return dotCoords
    .map(
      ([col, row]) =>
        `<circle cx="${x + col * cellSize}" cy="${y + row * cellSize}" r="${cellSize * 0.28}" fill="${foreground}" />`,
    )
    .join('');
}

function buildShieldPath(
  x: number,
  y: number,
  size: number,
  fill: string,
): string {
  return `<path d="M ${x + size * 0.5} ${y} C ${x + size * 0.82} ${y}, ${x + size} ${y + size * 0.16}, ${x + size} ${y + size * 0.42} C ${x + size} ${y + size * 0.72}, ${x + size * 0.8} ${y + size * 0.9}, ${x + size * 0.5} ${y + size} C ${x + size * 0.2} ${y + size * 0.9}, ${x} ${y + size * 0.72}, ${x} ${y + size * 0.42} C ${x} ${y + size * 0.16}, ${x + size * 0.18} ${y}, ${x + size * 0.5} ${y} Z" fill="${fill}" />`;
}

function buildStarPoints(
  cx: number,
  cy: number,
  outerRadius: number,
  innerRadius: number,
  points: number,
): string {
  const result: string[] = [];

  for (let i = 0; i < points * 2; i += 1) {
    const angle = (Math.PI / points) * i - Math.PI / 2;
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    result.push(
      `${cx + Math.cos(angle) * radius},${cy + Math.sin(angle) * radius}`,
    );
  }

  return result.join(' ');
}

function isDarkModule(
  modules: {
    size: number;
    get: (row: number, col: number) => boolean | number;
  },
  row: number,
  col: number,
): boolean {
  if (row < 0 || col < 0 || row >= modules.size || col >= modules.size) {
    return false;
  }

  return Boolean(modules.get(row, col));
}

async function buildPdfBuffer(svg: string): Promise<Buffer> {
  const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
  const pdfDocument = await PDFDocument.create();
  const image = await pdfDocument.embedPng(pngBuffer);
  const page = pdfDocument.addPage([image.width, image.height]);

  page.drawImage(image, {
    x: 0,
    y: 0,
    width: image.width,
    height: image.height,
  });

  return Buffer.from(await pdfDocument.save());
}
