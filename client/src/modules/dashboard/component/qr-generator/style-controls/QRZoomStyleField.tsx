"use client";

import { Label } from "@/components/ui/Label";

type QRZoomStyleFieldProps = {
  value: number;
  onChange: (value: number) => void;
};

export default function QRZoomStyleField({
  value,
  onChange,
}: QRZoomStyleFieldProps) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor="qr-zoom">Zoom</Label>
        <span className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
          {value.toFixed(2)}x
        </span>
      </div>

      <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.18)] px-4 py-3">
        <input
          id="qr-zoom"
          type="range"
          min={0.5}
          max={5}
          step={0.25}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-[hsl(var(--border))]"
        />
      </div>
    </div>
  );
}
