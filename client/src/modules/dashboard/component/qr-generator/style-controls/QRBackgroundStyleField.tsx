"use client";

import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

type QRBackgroundStyleFieldProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function QRBackgroundStyleField({
  value,
  onChange,
}: QRBackgroundStyleFieldProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor="qr-background">Background</Label>
      <div className="flex gap-3">
        <Input
          id="qr-background"
          type="color"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-14 cursor-pointer p-1"
        />
        <Input
          value={value.toUpperCase()}
          onChange={(event) => onChange(event.target.value)}
          className="font-mono"
        />
      </div>
    </div>
  );
}
