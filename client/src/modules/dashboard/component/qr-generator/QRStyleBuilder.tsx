"use client";

import { QRStyleDraft } from "../../interface/qrGeneratorStyle";
import QRBackgroundStyleField from "./style-controls/QRBackgroundStyleField";
import QRBodyShapeStyleField from "./style-controls/QRBodyShapeStyleField";
import QREyeBallStyleField from "./style-controls/QREyeBallStyleField";
import QREyeFrameStyleField from "./style-controls/QREyeFrameStyleField";
import QRForegroundStyleField from "./style-controls/QRForegroundStyleField";
import QRZoomStyleField from "./style-controls/QRZoomStyleField";

type QRStyleBuilderProps = {
  style: QRStyleDraft;
  disabled?: boolean;
  onStyleChange: (patch: Partial<QRStyleDraft>) => void;
};

export default function QRStyleBuilder({
  style,
  disabled = false,
  onStyleChange,
}: QRStyleBuilderProps) {
  return (
    <fieldset
      disabled={disabled}
      className={`space-y-5 ${disabled ? "opacity-60" : ""}`}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <QRForegroundStyleField
          value={style.foreground}
          onChange={(foreground) => onStyleChange({ foreground })}
        />

        <QRBackgroundStyleField
          value={style.background}
          onChange={(background) => onStyleChange({ background })}
        />
      </div>

      <QRZoomStyleField
        value={style.zoom}
        onChange={(zoom) => onStyleChange({ zoom })}
      />

      <QRBodyShapeStyleField
        value={style.bodyShape}
        foreground={style.foreground}
        onChange={(bodyShape) => onStyleChange({ bodyShape })}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <QREyeFrameStyleField
          value={style.eyeFrameShape}
          foreground={style.foreground}
          background={style.background}
          onChange={(eyeFrameShape) => onStyleChange({ eyeFrameShape })}
        />

        <QREyeBallStyleField
          value={style.eyeBallShape}
          foreground={style.foreground}
          onChange={(eyeBallShape) => onStyleChange({ eyeBallShape })}
        />
      </div>
    </fieldset>
  );
}
