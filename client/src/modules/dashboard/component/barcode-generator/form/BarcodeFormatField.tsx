import { Label } from "@/components/ui/Label";
import { BarcodeFormatOption } from "@/service/dashboard/barcode-generator/type";
import { ChevronDown } from "lucide-react";

export default function BarcodeFormatField({
  formats,
  value,
  onChange,
}: {
  formats: BarcodeFormatOption[];
  value: string;
  onChange: (value: string) => void;
}) {
  const selectedFormat = formats.find((option) => option.value === value);

  return (
    <div className="grid gap-2">
      <Label htmlFor="barcode-format">Barcode format</Label>
      <div className="relative">
        <select
          id="barcode-format"
          name="format"
          value={value}
          disabled={!selectedFormat}
          onChange={(event) => onChange(event.target.value)}
          className="h-11 w-full appearance-none rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 pr-10 text-sm outline-none transition focus:border-[hsl(var(--primary))] focus:ring-2 focus:ring-[hsl(var(--ring)/0.22)] max-md:h-10 max-md:rounded-lg max-md:text-sm"
        >
          {!selectedFormat ? (
            <option>Formats unavailable</option>
          ) : null}
          {formats.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[hsl(var(--muted-foreground))]" />
      </div>
      <p className="text-xs text-[hsl(var(--muted-foreground))] max-md:text-[11px]">
        {selectedFormat
          ? `${selectedFormat.description} ${selectedFormat.contentRule}.`
          : "Unable to load barcode formats."}
      </p>
    </div>
  );
}
