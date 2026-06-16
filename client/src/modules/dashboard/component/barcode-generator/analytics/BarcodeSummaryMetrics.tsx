import { BarcodeAnalyticsSummary } from "@/service/dashboard/barcode-generator/type";
import { ArrowDownToLine, Barcode, TrendingUp } from "lucide-react";
import ToolMetricCard from "../../common/ToolMetricCard";

type BarcodeSummaryMetricsProps = {
  summary: BarcodeAnalyticsSummary | null;
  growth: number | null;
  summaryLoading: boolean;
  growthLoading: boolean;
};

export default function BarcodeSummaryMetrics({
  summary,
  growth,
  summaryLoading,
  growthLoading,
}: BarcodeSummaryMetricsProps) {
  const metrics = [
    {
      label: "Generated",
      value: summary?.generated ?? 0,
      loading: summaryLoading,
      icon: Barcode,
      iconClassName: "text-[hsl(var(--primary))]",
    },
    {
      label: "Downloads",
      value: summary?.downloads ?? 0,
      loading: summaryLoading,
      icon: ArrowDownToLine,
      iconClassName: "text-indigo-500",
    },
    {
      label: "Growth",
      value: `${growth !== null && growth > 0 ? "+" : ""}${growth ?? 0}%`,
      loading: growthLoading,
      icon: TrendingUp,
      iconClassName:
        growth !== null && growth < 0 ? "text-rose-500" : "text-emerald-500",
    },
  ];

  return (
    <div
      className="grid gap-3 max-[540px]:gap-2 sm:grid-cols-2 lg:grid-cols-3"
      aria-busy={summaryLoading || growthLoading}
    >
      {metrics.map(({ label, value, loading, icon: Icon, iconClassName }) => (
        <ToolMetricCard
          key={label}
          label={label}
          value={
            <div className="flex items-end justify-between gap-3 max-[540px]:gap-2">
              <span className="text-3xl max-[540px]:text-2xl">
                {loading ? "—" : value}
              </span>
              <Icon
                className={`mb-1 h-5 w-5 max-[540px]:h-4 max-[540px]:w-4 ${iconClassName}`}
              />
            </div>
          }
          className="bg-[hsl(var(--secondary)/0.22)] max-[540px]:rounded-lg max-[540px]:p-3"
          labelClassName="max-[540px]:text-[10px] max-[540px]:tracking-[0.14em]"
          valueClassName="max-[540px]:mt-1"
        />
      ))}
    </div>
  );
}
