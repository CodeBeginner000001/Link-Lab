import {
  BodyShape,
  EyeBallShape,
  EyeFrameShape,
  QRStyleDraft,
} from "../../interface/qrGeneratorStyle";

export const QR_PREVIEW_SIZE = 320;
export const QR_PREVIEW_MODULES = 31;

const clampZoom = (value: number) => Math.min(5, Math.max(0.5, value));

export type QrPreviewRenderConfig = {
  width: number;
  height: number;
  previewModules: number;
  moduleSize: number;
  qrSize: number;
  offsetX: number;
  offsetY: number;
  cornerRadius: number;
};

const drawRoundedRect = (
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) => {
  const safeRadius = Math.max(0, Math.min(radius, width / 2, height / 2));

  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.lineTo(x + width - safeRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  context.lineTo(x + width, y + height - safeRadius);
  context.quadraticCurveTo(
    x + width,
    y + height,
    x + width - safeRadius,
    y + height,
  );
  context.lineTo(x + safeRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  context.lineTo(x, y + safeRadius);
  context.quadraticCurveTo(x, y, x + safeRadius, y);
  context.closePath();
  context.fill();
};

const isFinderZone = (row: number, column: number, modules: number) => {
  const topLeft = row < 7 && column < 7;
  const topRight = row < 7 && column >= modules - 7;
  const bottomLeft = row >= modules - 7 && column < 7;

  return topLeft || topRight || bottomLeft;
};

export const drawBodyModule = ({
  context,
  x,
  y,
  size,
  pattern,
  row,
  column,
}: {
  context: CanvasRenderingContext2D;
  x: number;
  y: number;
  size: number;
  pattern: BodyShape;
  row: number;
  column: number;
}) => {
  switch (pattern) {
    case "dots":
      context.beginPath();
      context.arc(x + size / 2, y + size / 2, size * 0.36, 0, Math.PI * 2);
      context.fill();
      return;

    case "rounded":
      drawRoundedRect(
        context,
        x + size * 0.08,
        y + size * 0.08,
        size * 0.84,
        size * 0.84,
        size * 0.28,
      );
      return;

    case "classy":
      if ((row + column) % 2 === 0) {
        context.beginPath();
        context.arc(x + size / 2, y + size / 2, size * 0.34, 0, Math.PI * 2);
        context.fill();
      } else {
        drawRoundedRect(
          context,
          x + size * 0.1,
          y + size * 0.1,
          size * 0.8,
          size * 0.8,
          size * 0.32,
        );
      }
      return;

    case "diamond":
      context.beginPath();
      context.moveTo(x + size / 2, y + size * 0.05);
      context.lineTo(x + size * 0.95, y + size / 2);
      context.lineTo(x + size / 2, y + size * 0.95);
      context.lineTo(x + size * 0.05, y + size / 2);
      context.closePath();
      context.fill();
      return;

    case "horizontal":
      drawRoundedRect(
        context,
        x,
        y + size * 0.2,
        size,
        size * 0.6,
        size * 0.15,
      );
      return;

    case "vertical":
      drawRoundedRect(
        context,
        x + size * 0.2,
        y,
        size * 0.6,
        size,
        size * 0.15,
      );
      return;

    case "star": {
      context.beginPath();
      const cx = x + size / 2;
      const cy = y + size / 2;

      for (let i = 0; i < 5; i += 1) {
        const outerAngle = ((i * 72 - 90) * Math.PI) / 180;
        const innerAngle = ((i * 72 + 36 - 90) * Math.PI) / 180;

        context.lineTo(
          cx + Math.cos(outerAngle) * size * 0.42,
          cy + Math.sin(outerAngle) * size * 0.42,
        );
        context.lineTo(
          cx + Math.cos(innerAngle) * size * 0.18,
          cy + Math.sin(innerAngle) * size * 0.18,
        );
      }

      context.closePath();
      context.fill();
      return;
    }

    case "mosaic":
      if ((row + column) % 2 === 0) {
        context.fillRect(
          x + size * 0.05,
          y + size * 0.05,
          size * 0.42,
          size * 0.42,
        );
        context.fillRect(
          x + size * 0.53,
          y + size * 0.53,
          size * 0.42,
          size * 0.42,
        );
      } else {
        context.fillRect(
          x + size * 0.05,
          y + size * 0.53,
          size * 0.42,
          size * 0.42,
        );
        context.fillRect(
          x + size * 0.53,
          y + size * 0.05,
          size * 0.42,
          size * 0.42,
        );
      }
      return;

    case "arrow":
      context.beginPath();
      context.moveTo(x + size * 0.5, y + size * 0.05);
      context.lineTo(x + size * 0.95, y + size * 0.5);
      context.lineTo(x + size * 0.7, y + size * 0.5);
      context.lineTo(x + size * 0.7, y + size * 0.95);
      context.lineTo(x + size * 0.3, y + size * 0.95);
      context.lineTo(x + size * 0.3, y + size * 0.5);
      context.lineTo(x + size * 0.05, y + size * 0.5);
      context.closePath();
      context.fill();
      return;

    case "square":
    default:
      context.fillRect(x, y, size, size);
  }
};

export const drawEyeFrame = ({
  context,
  x,
  y,
  moduleSize,
  foregroundColor,
  backgroundColor,
  shape,
}: {
  context: CanvasRenderingContext2D;
  x: number;
  y: number;
  moduleSize: number;
  foregroundColor: string;
  backgroundColor: string;
  shape: EyeFrameShape;
}) => {
  const outer = moduleSize * 7;
  const middle = moduleSize * 5;

  context.fillStyle = foregroundColor;

  switch (shape) {
    case "circle":
      context.beginPath();
      context.arc(x + outer / 2, y + outer / 2, outer / 2, 0, Math.PI * 2);
      context.fill();

      context.fillStyle = backgroundColor;
      context.beginPath();
      context.arc(x + outer / 2, y + outer / 2, middle / 2, 0, Math.PI * 2);
      context.fill();
      return;

    case "rounded":
      drawRoundedRect(context, x, y, outer, outer, moduleSize * 1.4);
      context.fillStyle = backgroundColor;
      drawRoundedRect(
        context,
        x + moduleSize,
        y + moduleSize,
        middle,
        middle,
        moduleSize,
      );
      return;

    case "dotted": {
      const dotSize = moduleSize * 0.6;
      const gap = moduleSize;

      for (let index = 0; index < 7; index += 1) {
        context.beginPath();
        context.arc(
          x + index * gap + gap / 2,
          y + gap / 2,
          dotSize / 2,
          0,
          Math.PI * 2,
        );
        context.fill();

        context.beginPath();
        context.arc(
          x + index * gap + gap / 2,
          y + outer - gap / 2,
          dotSize / 2,
          0,
          Math.PI * 2,
        );
        context.fill();

        if (index > 0 && index < 6) {
          context.beginPath();
          context.arc(
            x + gap / 2,
            y + index * gap + gap / 2,
            dotSize / 2,
            0,
            Math.PI * 2,
          );
          context.fill();

          context.beginPath();
          context.arc(
            x + outer - gap / 2,
            y + index * gap + gap / 2,
            dotSize / 2,
            0,
            Math.PI * 2,
          );
          context.fill();
        }
      }
      return;
    }

    case "inset":
      context.fillRect(x, y, outer, outer);

      context.fillStyle = backgroundColor;
      context.fillRect(
        x + moduleSize * 0.6,
        y + moduleSize * 0.6,
        outer - moduleSize * 1.2,
        outer - moduleSize * 1.2,
      );

      context.fillStyle = foregroundColor;
      context.fillRect(
        x + moduleSize * 1.2,
        y + moduleSize * 1.2,
        outer - moduleSize * 2.4,
        outer - moduleSize * 2.4,
      );

      context.fillStyle = backgroundColor;
      context.fillRect(x + moduleSize, y + moduleSize, middle, middle);
      return;

    case "shield":
      context.beginPath();
      context.moveTo(x + outer / 2, y);
      context.lineTo(x + outer, y + moduleSize * 1.5);
      context.lineTo(x + outer, y + outer * 0.7);
      context.quadraticCurveTo(
        x + outer / 2,
        y + outer * 1.1,
        x,
        y + outer * 0.7,
      );
      context.lineTo(x, y + moduleSize * 1.5);
      context.closePath();
      context.fill();

      context.fillStyle = backgroundColor;
      drawRoundedRect(
        context,
        x + moduleSize,
        y + moduleSize,
        middle,
        middle,
        moduleSize * 0.5,
      );
      return;

    case "square":
    default:
      context.fillRect(x, y, outer, outer);
      context.fillStyle = backgroundColor;
      context.fillRect(x + moduleSize, y + moduleSize, middle, middle);
  }
};

export const drawEyeBall = ({
  context,
  x,
  y,
  moduleSize,
  foregroundColor,
  shape,
}: {
  context: CanvasRenderingContext2D;
  x: number;
  y: number;
  moduleSize: number;
  foregroundColor: string;
  shape: EyeBallShape;
}) => {
  const inner = moduleSize * 3;
  const startX = x + moduleSize * 2;
  const startY = y + moduleSize * 2;
  const centerX = startX + inner / 2;
  const centerY = startY + inner / 2;

  context.fillStyle = foregroundColor;

  switch (shape) {
    case "circle":
      context.beginPath();
      context.arc(centerX, centerY, inner / 2, 0, Math.PI * 2);
      context.fill();
      return;

    case "rounded":
      drawRoundedRect(context, startX, startY, inner, inner, moduleSize * 0.8);
      return;

    case "diamond":
      context.beginPath();
      context.moveTo(centerX, startY);
      context.lineTo(startX + inner, centerY);
      context.lineTo(centerX, startY + inner);
      context.lineTo(startX, centerY);
      context.closePath();
      context.fill();
      return;

    case "leaf":
      context.beginPath();
      context.moveTo(startX, startY);
      context.quadraticCurveTo(
        startX + inner,
        startY,
        startX + inner,
        startY + inner,
      );
      context.quadraticCurveTo(startX, startY + inner, startX, startY);
      context.closePath();
      context.fill();
      return;

    case "stripe":
      for (let index = 0; index < 3; index += 1) {
        context.fillRect(
          startX + index * moduleSize + moduleSize * 0.15,
          startY,
          moduleSize * 0.7,
          inner,
        );
      }
      return;

    case "square":
    default:
      context.fillRect(startX, startY, inner, inner);
  }
};

const getModuleSize = (zoom: number) => {
  const normalizedZoom = (clampZoom(zoom) - 0.5) / 4.5;

  return 6 + normalizedZoom * 4;
};

const clearPreviewCanvas = (canvas: HTMLCanvasElement) => {
  const context = canvas.getContext("2d");

  if (!context) {
    return;
  }

  canvas.width = QR_PREVIEW_SIZE;
  canvas.height = QR_PREVIEW_SIZE;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#FFFFFF";
  context.fillRect(0, 0, canvas.width, canvas.height);
};

export const getQrPreviewRenderConfig = (zoom: number): QrPreviewRenderConfig => {
  const moduleSize = getModuleSize(zoom);
  const qrSize = QR_PREVIEW_MODULES * moduleSize;
  const offset = (QR_PREVIEW_SIZE - qrSize) / 2;

  return {
    width: QR_PREVIEW_SIZE,
    height: QR_PREVIEW_SIZE,
    previewModules: QR_PREVIEW_MODULES,
    moduleSize,
    qrSize,
    offsetX: offset,
    offsetY: offset,
    cornerRadius: 16,
  };
};

export const drawStyledQrPreview = (
  canvas: HTMLCanvasElement,
  content: string,
  style: QRStyleDraft,
) => {
  const context = canvas.getContext("2d");

  if (!context || !content.trim()) {
    clearPreviewCanvas(canvas);
    return;
  }

  canvas.width = QR_PREVIEW_SIZE;
  canvas.height = QR_PREVIEW_SIZE;

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = style.background;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const { moduleSize, offsetX, offsetY } = getQrPreviewRenderConfig(style.zoom);

  context.fillStyle = style.foreground;

  for (let row = 0; row < QR_PREVIEW_MODULES; row += 1) {
    for (let column = 0; column < QR_PREVIEW_MODULES; column += 1) {
      if (isFinderZone(row, column, QR_PREVIEW_MODULES)) {
        continue;
      }

      const charCode = content.charCodeAt((row + column) % content.length);
      const hash =
        (charCode * (row + 3) * (column + 5) + row * 11 + column * 7) % 7;

      if (hash === 0 || hash === 1 || hash === 3) {
        drawBodyModule({
          context,
          x: offsetX + column * moduleSize,
          y: offsetY + row * moduleSize,
          size: moduleSize,
          pattern: style.bodyShape,
          row,
          column,
        });
      }
    }
  }

  const eyePositions = [
    { x: offsetX, y: offsetY },
    { x: offsetX + (QR_PREVIEW_MODULES - 7) * moduleSize, y: offsetY },
    { x: offsetX, y: offsetY + (QR_PREVIEW_MODULES - 7) * moduleSize },
  ];

  for (const position of eyePositions) {
    drawEyeFrame({
      context,
      x: position.x,
      y: position.y,
      moduleSize,
      foregroundColor: style.foreground,
      backgroundColor: style.background,
      shape: style.eyeFrameShape,
    });

    drawEyeBall({
      context,
      x: position.x,
      y: position.y,
      moduleSize,
      foregroundColor: style.foreground,
      shape: style.eyeBallShape,
    });
  }
};

export const drawBodyShapePreview = (
  context: CanvasRenderingContext2D,
  size: number,
  foreground: string,
  option: BodyShape,
) => {
  context.fillStyle = foreground;
  const scaled = size * 0.7;
  const offset = (size - scaled) / 2;
  const miniModule = scaled / 3;

  for (let row = 0; row < 3; row += 1) {
    for (let column = 0; column < 3; column += 1) {
      if ((row + column) % 2 === 0 || (row === 1 && column === 1)) {
        drawBodyModule({
          context,
          x: offset + column * miniModule,
          y: offset + row * miniModule,
          size: miniModule,
          pattern: option,
          row,
          column,
        });
      }
    }
  }
};

export const drawEyeFramePreview = (
  context: CanvasRenderingContext2D,
  size: number,
  foreground: string,
  background: string,
  option: EyeFrameShape,
) => {
  drawEyeFrame({
    context,
    x: 0,
    y: 0,
    moduleSize: size / 7,
    foregroundColor: foreground,
    backgroundColor: background,
    shape: option,
  });
};

export const drawEyeBallPreview = (
  context: CanvasRenderingContext2D,
  size: number,
  foreground: string,
  option: EyeBallShape,
) => {
  context.fillStyle = foreground;
  const scaled = size * 0.7;
  const offset = (size - scaled) / 2;

  switch (option) {
    case "circle":
      context.beginPath();
      context.arc(size / 2, size / 2, scaled / 2, 0, Math.PI * 2);
      context.fill();
      return;

    case "rounded":
      drawRoundedRect(context, offset, offset, scaled, scaled, scaled * 0.25);
      return;

    case "diamond":
      context.beginPath();
      context.moveTo(size / 2, offset);
      context.lineTo(offset + scaled, size / 2);
      context.lineTo(size / 2, offset + scaled);
      context.lineTo(offset, size / 2);
      context.closePath();
      context.fill();
      return;

    case "leaf":
      context.beginPath();
      context.moveTo(offset, offset);
      context.quadraticCurveTo(
        offset + scaled,
        offset,
        offset + scaled,
        offset + scaled,
      );
      context.quadraticCurveTo(offset, offset + scaled, offset, offset);
      context.closePath();
      context.fill();
      return;

    case "stripe":
      for (let index = 0; index < 3; index += 1) {
        context.fillRect(
          offset + index * (scaled / 3) + 1,
          offset,
          scaled / 3 - 2,
          scaled,
        );
      }
      return;

    case "square":
    default:
      context.fillRect(offset, offset, scaled, scaled);
  }
};
