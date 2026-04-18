export enum QrContentType {
  URL = 'URL',
  TEXT = 'TEXT',
  EMAIL = 'EMAIL',
  WIFI = 'WIFI',
}

export enum QrStatus {
  ACTIVE = 'ACTIVE',
  DELETED = 'DEACTIVATED',
}

export enum QrExportType {
  PNG = 'PNG',
  JPG = 'JPG',
  JPEG = 'JPEG',
  SVG = 'SVG',
  WEBP = 'WEBP',
  PDF = 'PDF',
  COPY = 'COPY',
}

export enum QrTraceability {
  TRACEABLE = 'TRACEABLE',
  NON_TRACEABLE = 'NON_TRACEABLE',
}

export enum BodyShape {
  SQUARE = 'square',
  DOTS = 'dots',
  ROUNDED = 'rounded',
  CLASSY = 'classy',
  DIAMOND = 'diamond',
  HORIZONTAL = 'horizontal',
  VERTICAL = 'vertical',
  STAR = 'star',
  MOSAIC = 'mosaic',
  ARROW = 'arrow',
}

export enum EyeFrameShape {
  SQUARE = 'square',
  ROUNDED = 'rounded',
  CIRCLE = 'circle',
  DOTTED = 'dotted',
  INSET = 'inset',
  SHIELD = 'shield',
}

export enum EyeBallShape {
  SQUARE = 'square',
  ROUNDED = 'rounded',
  CIRCLE = 'circle',
  DIAMOND = 'diamond',
  LEAF = 'leaf',
  STRIPE = 'stripe',
}
