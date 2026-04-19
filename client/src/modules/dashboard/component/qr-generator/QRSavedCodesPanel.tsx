import { QrDashboardItem } from "@/service/dashboard/qr-generator/type";
import { Button } from "@/components/ui/Button";
import { truncateText } from "@/utils/common-helper";
import { formatDateTime } from "@/utils/date-time-helper";
import { CheckCircle2, Download, QrCode, Trash2 } from "lucide-react";
import { QR_CONTENT_CONFIG, QR_CONTENT_TYPE_FROM_API } from "../../interface/qrGeneratorConfig";
import {
  getBodyShapeLabel,
  getEyeBallLabel,
  getEyeFrameLabel,
} from "../../interface/qrGeneratorStyle";
import ToolEmptyState from "../common/ToolEmptyState";
import ToolExpandableRows from "../common/ToolExpandableRows";
import ToolFeaturePill from "../common/ToolFeaturePill";
import ToolMetricCard from "../common/ToolMetricCard";
import ToolPanel from "../common/ToolPanel";
import ToolTableWrapper from "../common/ToolTableWrapper";
import { formatDelay } from "@/utils/date-time-helper";
import QRDeleteModal from "./QRDeleteModal";
import QRCopyActionButton from "./QRCopyActionButton";
import QRExportModal from "./QRExportModal";
import QRCanvasPreview from "./QRCanvasPreview";

type QRSavedCodesPanelProps = {
  items: QrDashboardItem[];
  totalQrCount: number;
  totalScanCount: number;
  totalExportCount: number;
};

export default function QRSavedCodesPanel({
  items,
  totalQrCount,
  totalScanCount,
  totalExportCount,
}: QRSavedCodesPanelProps) {
  return (
    <ToolPanel
      heading="Saved QR Codes"
      para={
        totalQrCount
          ? `${totalQrCount} QR code${totalQrCount > 1 ? "s" : ""} saved. Expand a row to review its content, styling, and export activity.`
          : "Saved QR codes will appear here after you finalize and save a preview."
      }
      headerSlot={
        totalQrCount ? (
          <ToolFeaturePill icon={QrCode} label={`${totalQrCount} saved`} />
        ) : undefined
      }
    >
      {items.length ? (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-3">
            <ToolMetricCard label="Saved" value={totalQrCount} valueClassName="text-2xl" />
            <ToolMetricCard
              label="Tracked Scans"
              value={totalScanCount}
              valueClassName="text-2xl"
            />
            <ToolMetricCard
              label="Tracked Exports"
              value={totalExportCount}
              valueClassName="text-2xl"
            />
          </div>

          <ToolTableWrapper
            header={
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground)/0.9)]">
                    Saved QR Library
                  </p>
                  <p className="mt-1 text-sm text-[hsl(var(--muted-foreground)/0.88)]">
                    Expand any card to review the saved content, styling, and export activity.
                  </p>
                </div>
                <ToolFeaturePill label="Tap a card to expand" />
              </div>
            }
            headerClassName="bg-[hsl(var(--secondary)/0.18)]"
          >
            <ToolExpandableRows
              items={items.map((item) => {
                const contentType = QR_CONTENT_TYPE_FROM_API[item.contentType];

                return {
                  id: item.publicId,
                  trigger: (
                    <div className="p-3 sm:p-4">
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                        <div className="flex min-w-0 flex-col gap-3 min-[360px]:flex-row">
                          <div className="w-full max-w-[104px] shrink-0 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.18)] p-2">
                            <QRCanvasPreview
                              content={item.content}
                              style={item.style}
                              size={120}
                              className="mx-auto max-w-[80px]"
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap gap-2">
                              <ToolFeaturePill
                                label={QR_CONTENT_CONFIG[contentType].label}
                              />
                              <ToolFeaturePill
                                label={`${item.activity.totalScanCount} scans`}
                              />
                              <ToolFeaturePill
                                label={`Zoom ${item.style.zoom.toFixed(2)}x`}
                              />
                            </div>

                            <p className="mt-3 break-all text-sm font-medium leading-5 text-[hsl(var(--foreground))] max-[350px]:text-[13px]">
                              {truncateText(item.content, 112)}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 lg:ml-auto lg:justify-end">
                          <ToolFeaturePill
                            label={
                              item.tracking.isTraceable
                                ? "Tracked scans"
                                : "Direct QR"
                            }
                          />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                          <QRExportModal
                            publicId={item.publicId}
                            content={truncateText(item.content, 140)}
                            style={item.style}
                            trigger={
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                data-row-action="true"
                                aria-label={`Export QR ${item.publicId}`}
                                className="h-8 w-8 rounded-full border border-[hsl(var(--border))] text-[hsl(var(--foreground))] hover:border-[hsl(var(--primary)/0.4)] hover:bg-[hsl(var(--secondary)/0.7)] md:h-9 md:w-9"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            }
                          />

                          <QRCopyActionButton
                            publicId={item.publicId}
                            copyAvailability={item.copyAvailability}
                          />

                          <QRDeleteModal
                            publicId={item.publicId}
                            content={truncateText(item.content, 140)}
                            trigger={
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                data-row-action="true"
                                aria-label={`Delete QR ${item.publicId}`}
                                className="h-8 w-8 rounded-full border border-rose-200/80 text-rose-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 md:h-9 md:w-9 dark:border-rose-400/20 dark:text-rose-300 dark:hover:border-rose-400/30 dark:hover:bg-rose-400/10 dark:hover:text-rose-200"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ),
                  content: (
                    <div className="pb-4 max-[350px]:pb-3">
                      <div className="rounded-b-2xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.34)] p-4 max-[350px]:p-3">
                        <div className="grid gap-3 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.9fr)_minmax(0,0.95fr)_minmax(0,0.9fr)]">
                          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3.5">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground)/0.9)]">
                              Full Content
                            </p>
                            <p className="mt-2 break-all text-xs leading-5 text-[hsl(var(--foreground))]">
                              {item.content}
                            </p>
                          </div>

                          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3.5">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground)/0.9)]">
                              Colors
                            </p>
                            <div className="mt-2 space-y-2 text-xs text-[hsl(var(--foreground))]">
                              <p>Foreground: {item.style.foreground.toUpperCase()}</p>
                              <p>Background: {item.style.background.toUpperCase()}</p>
                            </div>
                          </div>

                          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3.5">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground)/0.9)]">
                              Styling
                            </p>
                            <div className="mt-2 space-y-2 text-xs text-[hsl(var(--foreground))]">
                              <p>Body: {getBodyShapeLabel(item.style.bodyShape)}</p>
                              <p>Frame: {getEyeFrameLabel(item.style.eyeFrameShape)}</p>
                              <p>Ball: {getEyeBallLabel(item.style.eyeBallShape)}</p>
                              <p>Zoom: {item.style.zoom.toFixed(2)}x</p>
                            </div>
                          </div>

                          <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3.5">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground)/0.9)]">
                              Exports
                            </p>
                            <div className="mt-2 grid gap-2 text-xs text-[hsl(var(--foreground))] sm:grid-cols-2">
                              <p>Total exports: {item.activity.totalExportCount}</p>
                              <p>PNG: {item.exportsByType.png}</p>
                              <p>JPG: {item.exportsByType.jpg}</p>
                              <p>JPEG: {item.exportsByType.jpeg}</p>
                              <p>SVG: {item.exportsByType.svg}</p>
                              <p>WEBP: {item.exportsByType.webp}</p>
                              <p>PDF: {item.exportsByType.pdf}</p>
                              <p>COPY: {item.exportsByType.copy}</p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2.5">
                          <ToolFeaturePill
                            icon={CheckCircle2}
                            label={`Created: ${formatDateTime(item.createdAt)}`}
                          />
                          <ToolFeaturePill
                            icon={CheckCircle2}
                            label={`Public ID: ${item.publicId}`}
                          />
                          <ToolFeaturePill
                            label={
                              item.copyAvailability.isAvailable
                                ? `Copy available • ${formatDelay(item.copyAvailability.cooldownSeconds)} cooldown after use`
                                : item.copyAvailability.nextAvailableAt
                                  ? `Copy unlocks ${formatDateTime(item.copyAvailability.nextAvailableAt)}`
                                  : `Copy locked for ${formatDelay(item.copyAvailability.cooldownSeconds)}`
                            }
                          />
                          <ToolFeaturePill
                            label={
                              item.tracking.isTraceable
                                ? "Server tracked scans"
                                : "No redirect tracking"
                            }
                          />
                        </div>
                      </div>
                    </div>
                  ),
                };
              })}
            />
          </ToolTableWrapper>
        </div>
      ) : (
        <ToolEmptyState
          icon={QrCode}
          title="No saved QR codes yet"
          description="Save a generated preview and the server-side table will appear here."
          className="min-h-55"
        />
      )}
    </ToolPanel>
  );
}
