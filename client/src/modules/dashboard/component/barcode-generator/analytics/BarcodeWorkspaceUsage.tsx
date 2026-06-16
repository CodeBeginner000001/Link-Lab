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
    <div className="mt-7 min-w-0 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-4 max-[540px]:mt-5 max-[540px]:p-3">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <p className="text-sm font-medium">Download formats</p>
        <p className="shrink-0 text-sm font-semibold">Total {total} </p>
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
