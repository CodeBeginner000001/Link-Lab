import { Label } from "@/components/ui/Label";

type BarcodeColorFieldProps = {
  id: string;
  label: string;
  name: string;
  defaultValue: string;
};

export default function BarcodeColorField({
  id,
  label,
  name,
  defaultValue,
}: BarcodeColorFieldProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <label
        htmlFor={id}
        className="flex h-11 cursor-pointer items-center gap-3 rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 max-md:h-10 max-md:gap-2"
      >
        <input
          id={id}
          name={name}
          type="color"
          defaultValue={defaultValue}
          className="h-7 w-9 cursor-pointer rounded border-0 bg-transparent p-0"
        />
        <span className="font-mono text-sm text-[hsl(var(--muted-foreground))] max-md:text-xs">
          {defaultValue}
        </span>
      </label>
    </div>
  );
}
