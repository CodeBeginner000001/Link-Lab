import { PDFDocument } from 'pdf-lib';
import * as QRCode from 'qrcode';
import sharp from 'sharp';
import {
  BodyShape,
  EyeBallShape,
  EyeFrameShape,
  QrExportType,
} from 'src/interfaces/features/qr-code.enums';
import type { QrCodeDocument } from 'src/models/qr-code.schema';

type QrStyle = QrCodeDocument['style'];

type QrCodeModules = {
  size: number;
  get: (row: number, col: number) => number;
};

type QrCodeResult = {
  modules: QrCodeModules;
  version: number;
};
type QrRenderLayout = {
  width: number;
  height: number;
  previewModules: number;
  moduleSize: number;
  qrSize: number;
  offsetX: number;
  offsetY: number;
  cornerRadius: number;
};

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
    content: string;
    copiedAt: string;
    nextCopyAvailableAt: string;
    cooldownSeconds: number;
    remainingSeconds: number;
    isCopyAvailable: boolean;
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
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 5;
const MIN_CELL_SIZE = 6;
const MAX_CELL_SIZE = 10;

export async function buildQrExportPayload(params: {
  publicId: string;
  exportType: Exclude<QrExportType, QrExportType.COPY>;
  qrValue: string;
  style: QrStyle;
  render?: QrRenderLayout;
}): Promise<QrExportPayload> {
  const { publicId, exportType, qrValue, style, render } = params;

  const renderedSvg = renderStyledQrSvg(qrValue, style, render);
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
  }
}

export function renderStyledQrSvg(
  qrValue: string,
  style: QrStyle,
  render?: QrRenderLayout,
): {
  svg: string;
} {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
  const qr = QRCode.create(qrValue, {
    errorCorrectionLevel: 'M',
    margin: 0,
  }) as QrCodeResult;
  const moduleCount = qr.modules.size;
  const cellSize = render
    ? render.qrSize / moduleCount
    : getModuleSize(style.zoom);
  const canvasWidth =
    render?.width ?? (moduleCount + QUIET_ZONE_MODULES * 2) * cellSize;
  const canvasHeight = render?.height ?? canvasWidth;
  const offsetX = render?.offsetX ?? QUIET_ZONE_MODULES * cellSize;
  const offsetY = render?.offsetY ?? QUIET_ZONE_MODULES * cellSize;
  const cornerRadius = render?.cornerRadius ?? 0;
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
          offsetX,
          offsetY,
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
      offsetX,
      offsetY,
    }),
  );

  return {
    svg: `
      <svg xmlns="http://www.w3.org/2000/svg" width="${canvasWidth}" height="${canvasHeight}" viewBox="0 0 ${canvasWidth} ${canvasHeight}" role="img" aria-label="QR code" shape-rendering="geometricPrecision">
        <defs>
          <clipPath id="qr-preview-clip">
            <rect width="${canvasWidth}" height="${canvasHeight}" rx="${cornerRadius}" ry="${cornerRadius}" />
          </clipPath>
        </defs>
        <g clip-path="url(#qr-preview-clip)">
          <rect width="${canvasWidth}" height="${canvasHeight}" fill="${style.background}" rx="${cornerRadius}" ry="${cornerRadius}" />
          <g fill="${style.foreground}">
            ${bodyElements.join('')}
          </g>
          ${eyeElements.join('')}
        </g>
      </svg>
    `.trim(),
  };
}

function clampZoom(value: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
}

function getModuleSize(zoom: number): number {
  const normalizedZoom = (clampZoom(zoom) - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM);

  return MIN_CELL_SIZE + normalizedZoom * (MAX_CELL_SIZE - MIN_CELL_SIZE);
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
  offsetX: number;
  offsetY: number;
  modules: QrCodeModules;
}): string {
  const { row, col, style, cellSize, offsetX, offsetY } = params;
  const x = offsetX + col * cellSize;
  const y = offsetY + row * cellSize;

  switch (style.bodyShape) {
    case BodyShape.SQUARE:
      return `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" />`;
    case BodyShape.DOTS:
      return `<circle cx="${x + cellSize / 2}" cy="${y + cellSize / 2}" r="${cellSize * 0.36}" />`;
    case BodyShape.ROUNDED:
      return `<rect x="${x + cellSize * 0.08}" y="${y + cellSize * 0.08}" width="${cellSize * 0.84}" height="${cellSize * 0.84}" rx="${cellSize * 0.28}" ry="${cellSize * 0.28}" />`;
    case BodyShape.CLASSY:
      if ((row + col) % 2 === 0) {
        return `<circle cx="${x + cellSize / 2}" cy="${y + cellSize / 2}" r="${cellSize * 0.34}" />`;
      }

      return `<rect x="${x + cellSize * 0.1}" y="${y + cellSize * 0.1}" width="${cellSize * 0.8}" height="${cellSize * 0.8}" rx="${cellSize * 0.32}" ry="${cellSize * 0.32}" />`;
    case BodyShape.DIAMOND:
      return `<polygon points="${x + cellSize / 2},${y + cellSize * 0.05} ${x + cellSize * 0.95},${y + cellSize / 2} ${x + cellSize / 2},${y + cellSize * 0.95} ${x + cellSize * 0.05},${y + cellSize / 2}" />`;
    case BodyShape.HORIZONTAL:
      return `<rect x="${x}" y="${y + cellSize * 0.2}" width="${cellSize}" height="${cellSize * 0.6}" rx="${cellSize * 0.24}" ry="${cellSize * 0.24}" />`;
    case BodyShape.VERTICAL:
      return `<rect x="${x + cellSize * 0.2}" y="${y}" width="${cellSize * 0.6}" height="${cellSize}" rx="${cellSize * 0.24}" ry="${cellSize * 0.24}" />`;
    case BodyShape.STAR:
      return `<polygon points="${buildStarPoints(x + cellSize / 2, y + cellSize / 2, cellSize * 0.42, cellSize * 0.18, 5)}" />`;
    case BodyShape.MOSAIC:
      if ((row + col) % 2 === 0) {
        return `
          <rect x="${x + cellSize * 0.05}" y="${y + cellSize * 0.05}" width="${cellSize * 0.42}" height="${cellSize * 0.42}" />
          <rect x="${x + cellSize * 0.53}" y="${y + cellSize * 0.53}" width="${cellSize * 0.42}" height="${cellSize * 0.42}" />
        `.trim();
      }

      return `
        <rect x="${x + cellSize * 0.05}" y="${y + cellSize * 0.53}" width="${cellSize * 0.42}" height="${cellSize * 0.42}" />
        <rect x="${x + cellSize * 0.53}" y="${y + cellSize * 0.05}" width="${cellSize * 0.42}" height="${cellSize * 0.42}" />
      `.trim();
    case BodyShape.ARROW:
      return `<polygon points="${x + cellSize * 0.5},${y + cellSize * 0.05} ${x + cellSize * 0.95},${y + cellSize * 0.5} ${x + cellSize * 0.7},${y + cellSize * 0.5} ${x + cellSize * 0.7},${y + cellSize * 0.95} ${x + cellSize * 0.3},${y + cellSize * 0.95} ${x + cellSize * 0.3},${y + cellSize * 0.5} ${x + cellSize * 0.05},${y + cellSize * 0.5}" />`;
  }
}

function renderEyePattern(params: {
  row: number;
  col: number;
  style: QrStyle;
  cellSize: number;
  offsetX: number;
  offsetY: number;
}): string {
  const { row, col, style, cellSize, offsetX, offsetY } = params;
  const x = offsetX + col * cellSize;
  const y = offsetY + row * cellSize;
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
      return `
        <rect x="${x}" y="${y}" width="${outerSize}" height="${outerSize}" fill="${foreground}" />
        <rect x="${x + cellSize * 0.6}" y="${y + cellSize * 0.6}" width="${outerSize - cellSize * 1.2}" height="${outerSize - cellSize * 1.2}" fill="${background}" />
        <rect x="${x + cellSize * 1.2}" y="${y + cellSize * 1.2}" width="${outerSize - cellSize * 2.4}" height="${outerSize - cellSize * 2.4}" fill="${foreground}" />
        <rect x="${innerX}" y="${innerY}" width="${innerSize}" height="${innerSize}" fill="${background}" />
      `.trim();
    case EyeFrameShape.SHIELD:
      return `
        ${buildShieldPath(x, y, outerSize, foreground)}
        <rect x="${innerX}" y="${innerY}" width="${innerSize}" height="${innerSize}" rx="${cellSize * 0.5}" ry="${cellSize * 0.5}" fill="${background}" />
      `.trim();
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
      return `<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="${size * (0.8 / 3)}" ry="${size * (0.8 / 3)}" />`;
    case EyeBallShape.CIRCLE:
      return `<circle cx="${x + size / 2}" cy="${y + size / 2}" r="${size / 2}" />`;
    case EyeBallShape.DIAMOND:
      return `<polygon points="${x + size / 2},${y} ${x + size},${y + size / 2} ${x + size / 2},${y + size} ${x},${y + size / 2}" />`;
    case EyeBallShape.LEAF:
      return `<path d="M ${x} ${y} Q ${x + size} ${y}, ${x + size} ${y + size} Q ${x} ${y + size}, ${x} ${y} Z" />`;
    case EyeBallShape.STRIPE:
      return `
        <rect x="${x + (size / 3) * 0.15}" y="${y}" width="${(size / 3) * 0.7}" height="${size}" />
        <rect x="${x + size / 3 + (size / 3) * 0.15}" y="${y}" width="${(size / 3) * 0.7}" height="${size}" />
        <rect x="${x + (size / 3) * 2 + (size / 3) * 0.15}" y="${y}" width="${(size / 3) * 0.7}" height="${size}" />
      `.trim();
  }
}

function buildDottedEyeFrame(params: {
  x: number;
  y: number;
  cellSize: number;
  foreground: string;
}): string {
  const { x, y, cellSize, foreground } = params;
  const circles: string[] = [];
  const dotRadius = (cellSize * 0.6) / 2;

  for (let index = 0; index < 7; index += 1) {
    circles.push(
      `<circle cx="${x + index * cellSize + cellSize / 2}" cy="${y + cellSize / 2}" r="${dotRadius}" fill="${foreground}" />`,
      `<circle cx="${x + index * cellSize + cellSize / 2}" cy="${y + 7 * cellSize - cellSize / 2}" r="${dotRadius}" fill="${foreground}" />`,
    );

    if (index > 0 && index < 6) {
      circles.push(
        `<circle cx="${x + cellSize / 2}" cy="${y + index * cellSize + cellSize / 2}" r="${dotRadius}" fill="${foreground}" />`,
        `<circle cx="${x + 7 * cellSize - cellSize / 2}" cy="${y + index * cellSize + cellSize / 2}" r="${dotRadius}" fill="${foreground}" />`,
      );
    }
  }

  return circles.join('');
}

function buildShieldPath(
  x: number,
  y: number,
  size: number,
  fill: string,
): string {
  return `<path d="M ${x + size / 2} ${y} L ${x + size} ${y + size * (1.5 / 7)} L ${x + size} ${y + size * 0.7} Q ${x + size / 2} ${y + size * 1.1} ${x} ${y + size * 0.7} L ${x} ${y + size * (1.5 / 7)} Z" fill="${fill}" />`;
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
