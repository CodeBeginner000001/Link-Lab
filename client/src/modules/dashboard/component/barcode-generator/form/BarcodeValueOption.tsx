export default function BarcodeValueOption() {
  return (
    <label className="flex items-start gap-3 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.24)] p-3 max-[540px]:gap-2 max-[540px]:rounded-lg max-[540px]:p-2.5">
      <input
        type="checkbox"
        name="showValue"
        defaultChecked
        className="mt-0.5 h-4 w-4 accent-[hsl(var(--primary))]"
      />
      <span>
        <span className="block text-sm font-medium max-[540px]:text-xs">
          Show encoded value
        </span>
        <span className="mt-1 block text-xs text-[hsl(var(--muted-foreground))] max-[540px]:text-[11px]">
          Display the content beneath the barcode bars.
        </span>
      </span>
    </label>
  );
}
