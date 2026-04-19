"use client";

import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

type QRForegroundStyleFieldProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function QRForegroundStyleField({
  value,
  onChange,
}: QRForegroundStyleFieldProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor="qr-foreground">Foreground</Label>
      <div className="flex gap-3">
        <Input
          id="qr-foreground"
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
