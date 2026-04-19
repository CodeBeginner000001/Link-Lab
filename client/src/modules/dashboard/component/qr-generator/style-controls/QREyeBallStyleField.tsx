"use client";

import { Label } from "@/components/ui/Label";
import {
  EYE_BALL_OPTIONS,
  EyeBallShape,
} from "@/modules/dashboard/interface/qrGeneratorStyle";
import QRPatternOption from "../QRPatternOption";
import { drawEyeBallPreview } from "../qr-preview-renderer";

type QREyeBallStyleFieldProps = {
  value: EyeBallShape;
  foreground: string;
  onChange: (value: EyeBallShape) => void;
};

export default function QREyeBallStyleField({
  value,
  foreground,
  onChange,
}: QREyeBallStyleFieldProps) {
  return (
    <div className="grid gap-2">
      <Label>Eye Ball</Label>
      <div className="grid grid-cols-3 gap-2">
        {EYE_BALL_OPTIONS.map((option) => (
          <QRPatternOption
            key={option.value}
            label={option.label}
            isSelected={value === option.value}
            onClick={() => onChange(option.value)}
            draw={(context, size) =>
              drawEyeBallPreview(context, size, foreground, option.value)
            }
          />
        ))}
      </div>
    </div>
  );
}
