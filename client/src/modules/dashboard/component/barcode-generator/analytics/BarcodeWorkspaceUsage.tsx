type BarcodeWorkspaceUsageProps = {
  svg: number;
  png: number;
};

export default function BarcodeWorkspaceUsage({
  svg,
  png,
}: BarcodeWorkspaceUsageProps) {
  const total = svg + png;
  const svgPercentage = total > 0 ? (svg / total) * 100 : 0;

  return (
    <div className="mt-7 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">Download formats</p>
        <p className="text-sm font-semibold">{total} total</p>
      </div>
      <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-[hsl(var(--muted))]">
        <div
          className="h-full bg-[hsl(var(--primary))]"
          style={{ width: `${svgPercentage}%` }}
        />
        <div className="h-full flex-1 bg-indigo-500" />
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-[hsl(var(--muted-foreground))]">
        <span>SVG {svg}</span>
        <span>PNG {png}</span>
      </div>
    </div>
  );
}
