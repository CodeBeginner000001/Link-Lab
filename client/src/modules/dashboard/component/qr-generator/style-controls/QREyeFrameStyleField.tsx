"use client";

import { Label } from "@/components/ui/Label";
import {
  EYE_FRAME_OPTIONS,
  EyeFrameShape,
} from "@/modules/dashboard/interface/qrGeneratorStyle";
import QRPatternOption from "../QRPatternOption";
import { drawEyeFramePreview } from "../qr-preview-renderer";

type QREyeFrameStyleFieldProps = {
  value: EyeFrameShape;
  foreground: string;
  background: string;
  onChange: (value: EyeFrameShape) => void;
};

export default function QREyeFrameStyleField({
  value,
  foreground,
  background,
  onChange,
}: QREyeFrameStyleFieldProps) {
  return (
    <div className="grid gap-2">
      <Label>Eye Frame</Label>
      <div className="grid grid-cols-3 gap-2">
        {EYE_FRAME_OPTIONS.map((option) => (
          <QRPatternOption
            key={option.value}
            label={option.label}
            isSelected={value === option.value}
            onClick={() => onChange(option.value)}
            draw={(context, size) =>
              drawEyeFramePreview(
                context,
                size,
                foreground,
                background,
                option.value,
              )
            }
          />
        ))}
      </div>
    </div>
  );
}
