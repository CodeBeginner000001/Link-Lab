import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";

type BarcodeNumberFieldProps = {
  id: string;
  label: string;
  name: string;
  defaultValue: number;
  min?: number;
  max?: number;
  step?: number;
  description?: string;
};

export default function BarcodeNumberField({
  id,
  label,
  name,
  defaultValue,
  min,
  max,
  step,
  description,
}: BarcodeNumberFieldProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type="number"
          min={min}
          max={max}
          step={step}
          defaultValue={defaultValue}
          className="h-11 pr-10"
        />
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[hsl(var(--muted-foreground))]">
          px
        </span>
      </div>
      {description ? (
        <p className="text-xs text-[hsl(var(--muted-foreground))]">
          {description}
        </p>
      ) : null}
    </div>
  );
}
