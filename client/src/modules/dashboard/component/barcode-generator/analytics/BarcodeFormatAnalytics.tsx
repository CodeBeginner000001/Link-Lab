import { BarcodeAnalyticsSummary } from "@/service/dashboard/barcode-generator/type";
import BarcodeFormatMix from "./BarcodeFormatMix";
import BarcodeWorkspaceUsage from "./BarcodeWorkspaceUsage";

export default function BarcodeFormatAnalytics({
  summary,
}: {
  summary: BarcodeAnalyticsSummary | null;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.18)] p-4 max-[540px]:rounded-xl max-[540px]:p-3 sm:p-5">
      <BarcodeFormatMix formats={summary?.formatDistribution ?? []} />
      <BarcodeWorkspaceUsage
        svg={summary?.downloadFormatDistribution.svg ?? 0}
        png={summary?.downloadFormatDistribution.png ?? 0}
      />
    </div>
  );
}
