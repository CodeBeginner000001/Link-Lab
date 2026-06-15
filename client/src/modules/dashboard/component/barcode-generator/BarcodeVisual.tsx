import { cn } from "@/utils/tailwindcss-merger";

const BAR_WIDTHS = [
  2, 1, 3, 1, 2, 4, 1, 2, 1, 3, 2, 1, 4, 2, 1, 3, 1, 1, 2, 4, 2, 1, 3, 2,
  1, 4, 1, 2, 3, 1, 2, 1, 4, 2, 1, 3, 2, 2, 1, 4, 1, 3, 2, 1, 2, 4, 1, 2,
  3, 1, 1, 4, 2, 3, 1, 2, 1, 3, 2, 4, 1, 1, 3, 2, 1, 4,
];

type BarcodeVisualProps = {
  compact?: boolean;
  className?: string;
};

export default function BarcodeVisual({
  compact = false,
  className,
}: BarcodeVisualProps) {
  return (
    <div
      aria-label="Static barcode preview"
      className={cn(
        "flex items-stretch justify-center overflow-hidden",
        compact ? "h-9 gap-px" : "h-28 gap-[2px]",
        className,
      )}
    >
      {BAR_WIDTHS.map((width, index) => (
        <span
          key={`${width}-${index}`}
          className={cn(
            "block shrink-0 bg-slate-950",
            !compact && index % 9 === 0 ? "mb-3" : "",
          )}
          style={{ width: `${compact ? width : width * 1.7}px` }}
        />
      ))}
    </div>
  );
}
