"use client";

import { Label } from "@/components/ui/Label";
import {
  BODY_SHAPE_OPTIONS,
  BodyShape,
} from "@/modules/dashboard/interface/qrGeneratorStyle";
import QRPatternOption from "../QRPatternOption";
import { drawBodyShapePreview } from "../qr-preview-renderer";

type QRBodyShapeStyleFieldProps = {
  value: BodyShape;
  foreground: string;
  onChange: (value: BodyShape) => void;
};

export default function QRBodyShapeStyleField({
  value,
  foreground,
  onChange,
}: QRBodyShapeStyleFieldProps) {
  return (
    <div className="grid gap-2">
      <Label>Body Shape</Label>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        {BODY_SHAPE_OPTIONS.map((option) => (
          <QRPatternOption
            key={option.value}
            label={option.label}
            isSelected={value === option.value}
            onClick={() => onChange(option.value)}
            draw={(context, size) =>
              drawBodyShapePreview(context, size, foreground, option.value)
            }
          />
        ))}
      </div>
    </div>
  );
}
