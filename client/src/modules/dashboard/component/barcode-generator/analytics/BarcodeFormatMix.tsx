import { BarcodeFormatDistribution } from "@/service/dashboard/barcode-generator/type";

const FORMAT_COLORS = [
  "bg-cyan-500",
  "bg-indigo-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-amber-500",
];

type BarcodeFormatMixProps = {
  formats: BarcodeFormatDistribution[];
};

export default function BarcodeFormatMix({ formats }: BarcodeFormatMixProps) {
  return (
    <div>
      <div className="flex items-center min-[288px]:items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">Format mix</p>
          <p className="mt-1 text-xs max-[288px]:hidden text-[hsl(var(--muted-foreground))]">
            Share of generated barcodes
          </p>
        </div>
        <span className="rounded-full text-nowrap bg-[hsl(var(--primary)/0.12)] px-2.5 py-1 text-xs font-semibold text-[hsl(var(--primary))]">
          {formats.length} formats
        </span>
      </div>

      {formats.length > 0 ? (
        <div className="mt-7 space-y-5">
          {formats.map((format, index) => (
            <div key={format.format}>
              <div className="mb-2 flex items-center justify-between gap-3 text-sm">
                <span className="font-medium">{format.format}</span>
                <span className="text-[hsl(var(--muted-foreground))]">
                  {format.percentage}% · {format.count}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[hsl(var(--muted))]">
                <div
                  className={`h-full rounded-full ${
                    FORMAT_COLORS[index % FORMAT_COLORS.length]
                  }`}
                  style={{ width: `${format.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-7 text-sm text-[hsl(var(--muted-foreground))]">
          Generate a barcode to see format distribution.
        </p>
      )}
    </div>
  );
}
