import { GetQrDashboardOverviewData } from "@/service/dashboard/qr-generator/type";
import { formatDateTime } from "@/utils/date-time-helper";
import { BarChart3, CalendarDays } from "lucide-react";
import {
  QR_CONTENT_CONFIG,
  QR_CONTENT_TYPE_FROM_API,
  QR_CONTENT_TYPE_TO_API,
} from "../../interface/qrGeneratorConfig";
import {
  BODY_SHAPE_OPTIONS,
  getBodyShapeLabel,
  getEyeBallLabel,
  getEyeFrameLabel,
} from "../../interface/qrGeneratorStyle";
import ToolEmptyState from "../common/ToolEmptyState";
import ToolFeaturePill from "../common/ToolFeaturePill";
import ToolMetricCard from "../common/ToolMetricCard";
import ToolPanel from "../common/ToolPanel";
import ToolPillGroup from "../common/ToolPillGroup";
import { truncateText } from "@/utils/common-helper";

type QRAnalyticsPanelProps = {
  overview: GetQrDashboardOverviewData;
};



export default function QRAnalyticsPanel({ overview }: QRAnalyticsPanelProps) {
  const { analyticsSummary, latestSavedRecords, mostEngagedRecord } = overview;

  const contentTypeCounts = Object.entries(QR_CONTENT_CONFIG).map(
    ([contentType, config]) => {
      const matchedEntry = analyticsSummary.contentTypeCounts.find(
        (entry) => entry.type === QR_CONTENT_TYPE_TO_API[contentType as keyof typeof QR_CONTENT_TYPE_TO_API],
      );

      return {
        label: config.label,
        count: matchedEntry?.count ?? 0,
      };
    },
  );

  const bodyShapeCounts = BODY_SHAPE_OPTIONS.map((option) => ({
    label: option.label,
    count:
      analyticsSummary.bodyStyleCounts.find(
        (entry) => entry.bodyShape === option.value,
      )?.count ?? 0,
  }));

  const maxTypeCount = Math.max(1, ...contentTypeCounts.map((entry) => entry.count));
  const maxBodyCount = Math.max(1, ...bodyShapeCounts.map((entry) => entry.count));

  return (
    <ToolPanel
      heading="QR Analytics"
      para="Server-side analytics for saved QR codes, including content mix, body-style usage, scans, and exports."
      headerSlot={
        <ToolPillGroup>
          <ToolFeaturePill
            icon={BarChart3}
            label={`${analyticsSummary.totalQrCount} tracked`}
          />
          <ToolFeaturePill
            icon={CalendarDays}
            label={
              latestSavedRecords[0]
                ? `Latest save ${formatDateTime(latestSavedRecords[0].createdAt)}`
                : "Awaiting first saved QR"
            }
          />
        </ToolPillGroup>
      }
    >
      {analyticsSummary.totalQrCount ? (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <ToolMetricCard
              label="Total Created"
              value={analyticsSummary.totalQrCount}
              valueClassName="text-2xl"
            />
            <ToolMetricCard
              label="Total Scans"
              value={analyticsSummary.totalScanCount}
              valueClassName="text-2xl"
            />
            <ToolMetricCard
              label="Total Exports"
              value={analyticsSummary.totalExportCount}
              valueClassName="text-2xl"
            />
            <ToolMetricCard
              label="Top Body Style"
              value={
                analyticsSummary.topBodyStyle
                  ? getBodyShapeLabel(analyticsSummary.topBodyStyle.value)
                  : "N/A"
              }
              valueClassName="text-xl"
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <section className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.2)] p-4">
              <p className="text-sm font-semibold">By Content Type</p>
              <div className="mt-4 space-y-3">
                {contentTypeCounts.map((entry) => (
                  <div key={entry.label} className="flex items-center gap-3">
                    <span className="w-14 text-xs text-[hsl(var(--muted-foreground))]">
                      {entry.label}
                    </span>
                    <div className="h-2 flex-1 rounded-full bg-[hsl(var(--border)/0.65)]">
                      <div
                        className="h-2 rounded-full bg-[hsl(var(--primary))]"
                        style={{
                          width: `${Math.max(
                            entry.count ? (entry.count / maxTypeCount) * 100 : 0,
                            entry.count ? 6 : 0,
                          )}%`,
                        }}
                      />
                    </div>
                    <span className="w-8 text-right text-xs text-[hsl(var(--muted-foreground))]">
                      {entry.count}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.2)] p-4">
              <p className="text-sm font-semibold">By Body Style</p>
              <div className="mt-4 space-y-3">
                {bodyShapeCounts.map((entry) => (
                  <div key={entry.label} className="flex items-center gap-3">
                    <span className="w-20 text-xs text-[hsl(var(--muted-foreground))]">
                      {entry.label}
                    </span>
                    <div className="h-2 flex-1 rounded-full bg-[hsl(var(--border)/0.65)]">
                      <div
                        className="h-2 rounded-full bg-[hsl(var(--primary))]"
                        style={{
                          width: `${Math.max(
                            entry.count ? (entry.count / maxBodyCount) * 100 : 0,
                            entry.count ? 6 : 0,
                          )}%`,
                        }}
                      />
                    </div>
                    <span className="w-8 text-right text-xs text-[hsl(var(--muted-foreground))]">
                      {entry.count}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <section className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.2)] p-4">
              <p className="text-sm font-semibold">Most Engaged Record</p>
              {mostEngagedRecord ? (
                <div className="mt-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
                  <p className="text-sm font-semibold text-[hsl(var(--foreground))]">
                    {truncateText(mostEngagedRecord.content, 110)}
                  </p>
                  <ToolPillGroup className="mt-3">
                    <ToolFeaturePill
                      label={`Type: ${QR_CONTENT_CONFIG[QR_CONTENT_TYPE_FROM_API[mostEngagedRecord.contentType]].label}`}
                    />
                    <ToolFeaturePill
                      label={`Scans: ${mostEngagedRecord.totalScanCount}`}
                    />
                    <ToolFeaturePill
                      label={`Exports: ${mostEngagedRecord.totalExportCount}`}
                    />
                  </ToolPillGroup>
                  <p className="mt-3 text-xs text-[hsl(var(--muted-foreground)/0.82)]">
                    Created {formatDateTime(mostEngagedRecord.createdAt)}
                  </p>
                </div>
              ) : null}
            </section>

            <section className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.2)] p-4">
              <p className="text-sm font-semibold">Latest Saved Records</p>
              <div className="mt-4 space-y-3">
                {latestSavedRecords.slice(0, 3).map((record, index) => (
                  <div
                    key={`${record.content}-${index}`}
                    className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4"
                  >
                    <p className="text-sm font-semibold text-[hsl(var(--foreground))]">
                      {truncateText(record.content, 96)}
                    </p>
                    <ToolPillGroup className="mt-3">
                      <ToolFeaturePill
                        label={`Type: ${QR_CONTENT_CONFIG[QR_CONTENT_TYPE_FROM_API[record.contentType]].label}`}
                      />
                      <ToolFeaturePill
                        label={`Body: ${getBodyShapeLabel(record.bodyShape)}`}
                      />
                      <ToolFeaturePill
                        label={`Frame: ${getEyeFrameLabel(record.eyeFrameShape)}`}
                      />
                      <ToolFeaturePill
                        label={`Ball: ${getEyeBallLabel(record.eyeBallShape)}`}
                      />
                      <ToolFeaturePill label={`Zoom: ${record.zoom.toFixed(2)}x`} />
                    </ToolPillGroup>
                    <p className="mt-3 text-xs text-[hsl(var(--muted-foreground)/0.82)]">
                      Saved {formatDateTime(record.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      ) : (
        <ToolEmptyState
          icon={BarChart3}
          title="No analytics yet"
          description="Save a QR code to the server and the analytics summary will appear here."
          className="min-h-55"
        />
      )}
    </ToolPanel>
  );
}
