export type BodyShape =
  | "square"
  | "dots"
  | "rounded"
  | "classy"
  | "diamond"
  | "horizontal"
  | "vertical"
  | "star"
  | "mosaic"
  | "arrow";

export type EyeFrameShape =
  | "square"
  | "rounded"
  | "circle"
  | "dotted"
  | "inset"
  | "shield";

export type EyeBallShape =
  | "square"
  | "rounded"
  | "circle"
  | "diamond"
  | "leaf"
  | "stripe";

export type QRStyleDraft = {
  foreground: string;
  background: string;
  zoom: number;
  bodyShape: BodyShape;
  eyeFrameShape: EyeFrameShape;
  eyeBallShape: EyeBallShape;
};

export const QR_STYLE_DEFAULTS: QRStyleDraft = {
  foreground: "#111827",
  background: "#FFFFFF",
  zoom: 1,
  bodyShape: "rounded",
  eyeFrameShape: "rounded",
  eyeBallShape: "rounded",
};

export const BODY_SHAPE_OPTIONS: Array<{ value: BodyShape; label: string }> = [
  { value: "square", label: "Square" },
  { value: "dots", label: "Dots" },
  { value: "rounded", label: "Rounded" },
  { value: "classy", label: "Classy" },
  { value: "diamond", label: "Diamond" },
  { value: "horizontal", label: "H-Line" },
  { value: "vertical", label: "V-Line" },
  { value: "star", label: "Star" },
  { value: "mosaic", label: "Mosaic" },
  { value: "arrow", label: "Arrow" },
];

export const EYE_FRAME_OPTIONS: Array<{ value: EyeFrameShape; label: string }> = [
  { value: "square", label: "Square" },
  { value: "rounded", label: "Rounded" },
  { value: "circle", label: "Circle" },
  { value: "dotted", label: "Dotted" },
  { value: "inset", label: "Inset" },
  { value: "shield", label: "Shield" },
];

export const EYE_BALL_OPTIONS: Array<{ value: EyeBallShape; label: string }> = [
  { value: "square", label: "Square" },
  { value: "rounded", label: "Rounded" },
  { value: "circle", label: "Circle" },
  { value: "diamond", label: "Diamond" },
  { value: "leaf", label: "Leaf" },
  { value: "stripe", label: "Stripe" },
];

export const isBodyShape = (value: string): value is BodyShape =>
  BODY_SHAPE_OPTIONS.some((option) => option.value === value);

export const isEyeFrameShape = (value: string): value is EyeFrameShape =>
  EYE_FRAME_OPTIONS.some((option) => option.value === value);

export const isEyeBallShape = (value: string): value is EyeBallShape =>
  EYE_BALL_OPTIONS.some((option) => option.value === value);

export const getBodyShapeLabel = (value: BodyShape) =>
  BODY_SHAPE_OPTIONS.find((option) => option.value === value)?.label ?? value;

export const getEyeFrameLabel = (value: EyeFrameShape) =>
  EYE_FRAME_OPTIONS.find((option) => option.value === value)?.label ?? value;

export const getEyeBallLabel = (value: EyeBallShape) =>
  EYE_BALL_OPTIONS.find((option) => option.value === value)?.label ?? value;
