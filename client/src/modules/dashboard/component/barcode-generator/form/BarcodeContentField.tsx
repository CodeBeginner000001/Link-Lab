import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { BarcodeFormatOption } from "@/service/dashboard/barcode-generator/type";

const sanitizeContent = (value: string, format: BarcodeFormatOption) => {
  const normalized = format.input.uppercase ? value.toUpperCase() : value;

  if (format.input.inputMode === "numeric") {
    return normalized.replace(/\D/g, "").slice(0, format.input.maxLength);
  }

  if (format.value === "CODE39") {
    return normalized
      .replace(/[^0-9A-Z .$/+%-]/g, "")
      .slice(0, format.input.maxLength);
  }

  return normalized.slice(0, format.input.maxLength);
};

export default function BarcodeContentField({
  format,
  value,
  onChange,
}: {
  format: BarcodeFormatOption;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-3">
        <Label htmlFor="barcode-content">Content</Label>
        <span className="text-xs text-[hsl(var(--muted-foreground))] max-md:text-[11px]">
          {value.length} / {format.input.maxLength}
        </span>
      </div>
      <Input
        id="barcode-content"
        name="content"
        required
        value={value}
        inputMode={format.input.inputMode}
        placeholder={format.input.placeholder}
        minLength={format.input.minLength}
        maxLength={format.input.maxLength}
        pattern={format.input.pattern}
        aria-describedby="barcode-content-rule"
        onChange={(event) =>
          onChange(sanitizeContent(event.target.value, format))
        }
        className="h-11 font-mono max-md:h-10 max-md:text-sm"
      />
      <p
        id="barcode-content-rule"
        className="text-xs text-[hsl(var(--muted-foreground))] max-md:text-[11px]"
      >
        {format.contentRule}
      </p>
    </div>
  );
}
