"use client";

import { Button } from "@/components/ui/Button";
import {
  BarChart3,
  CalendarDays,
  ExternalLink,
  Link2,
  Sparkles,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import ToolConfirmModal from "../component/common/ToolConfirmModal";
import ToolEmptyState from "../component/common/ToolEmptyState";
import ToolExpandableRows from "../component/common/ToolExpandableRows";
import ToolFeaturePill from "../component/common/ToolFeaturePill";
import ToolPageShell from "../component/common/ToolPageShell";
import ToolPanel from "../component/common/ToolPanel";
import ToolPillGroup from "../component/common/ToolPillGroup";
import URLShortenerForm from "../component/url-shortener/URLShortenerForm";

type ShortenedUrlItem = {
  id: string;
  originalUrl: string;
  shortUrl: string;
  alias: string;
  clicks: number;
  createdAt: string;
  status: "Active";
};

const shortenedUrls: ShortenedUrlItem[] = [
  {
    id: "launch-brief",
    originalUrl: "https://example.com/resources/product-launch-brief",
    shortUrl: "https://linklab.app/launch-brief",
    alias: "launch-brief",
    clicks: 94,
    createdAt: "Apr 11, 2026",
    status: "Active" as const,
  },
  {
    id: "spring-sale",
    originalUrl: "https://store.example.com/campaigns/spring-sale",
    shortUrl: "https://linklab.app/spring-sale",
    alias: "spring-sale",
    clicks: 153,
    createdAt: "Apr 9, 2026",
    status: "Active" as const,
  },
  {
    id: "docs-api",
    originalUrl: "https://docs.example.com/platform/api-reference",
    shortUrl: "https://linklab.app/docs-api",
    alias: "docs-api",
    clicks: 67,
    createdAt: "Apr 7, 2026",
    status: "Active" as const,
  },
];

const ShortUrlStatusChip = ({ status }: { status: ShortenedUrlItem["status"] }) => (
  <span className="inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-full border border-emerald-600/20 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] max-[350px]:px-2 max-[350px]:text-[9px] dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200 dark:shadow-none">
    <span className="h-1.5 w-1.5 rounded-full bg-current" />
    {status}
  </span>
);

const URLShortener = () => {
  const [deleteTarget, setDeleteTarget] = useState<ShortenedUrlItem | null>(null);
  const [deleteConfirmValue, setDeleteConfirmValue] = useState("");
  const analyticsRows = [...shortenedUrls].sort(
    (left, right) => right.clicks - left.clicks,
  );
  const totalClicks = analyticsRows.reduce((sum, item) => sum + item.clicks, 0);

  const openDeleteModal = (item: ShortenedUrlItem) => {
    setDeleteTarget(item);
    setDeleteConfirmValue("");
  };

  const closeDeleteModal = () => {
    setDeleteTarget(null);
    setDeleteConfirmValue("");
  };

  return (
    <>
      <ToolPageShell
        icon={Link2}
        heading="URL Shortener"
        para="Create short, memorable links that redirect to any URL."
        headingClassName="text-xl max-[350px]:text-lg sm:text-2xl"
        iconClassName="h-6 w-6 shrink-0 text-[hsl(var(--primary))] max-[350px]:h-5 max-[350px]:w-5"
        paraClassName="text-sm max-[350px]:text-xs max-[350px]:leading-5 sm:text-base"
      >
        <div className="grid gap-6 max-[350px]:gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
          <ToolPanel
            heading="Shorten a URL"
            para="Enter a long destination, choose an optional alias, and create a share-ready short link."
            headerSlot={
              <ToolFeaturePill icon={Sparkles} label="Responsive form" />
            }
          >
            <ToolPillGroup className="mb-5">
              <ToolFeaturePill icon={Link2} label="Shareable links" />
              <ToolFeaturePill icon={BarChart3} label="Click tracking ready" />
              <ToolFeaturePill icon={Sparkles} label="Custom aliases" />
            </ToolPillGroup>

            <URLShortenerForm />
          </ToolPanel>

          <ToolPanel
            heading="Your Shortened URLs"
            para={
              shortenedUrls.length
                ? `${shortenedUrls.length} generated link${shortenedUrls.length > 1 ? "s" : ""}.`
                : "Recent short links will appear here after you create them."
            }
            headerSlot={
              shortenedUrls.length ? (
                <ToolFeaturePill
                  icon={BarChart3}
                  label={`${shortenedUrls.length} total`}
                />
              ) : undefined
            }
          >
            {shortenedUrls.length ? (
              <div className="space-y-3 max-[350px]:space-y-2.5">
                {shortenedUrls.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 max-[350px]:flex-col max-[350px]:items-start max-[350px]:gap-2"
                  >
                    <p className="min-w-0 flex-1 truncate text-xs font-semibold text-[hsl(var(--primary))] max-[350px]:w-full max-[350px]:text-[11px] sm:text-sm">
                      {item.shortUrl}
                    </p>
                    <Button
                      variant="outline"
                      className="h-8 max-[350px]:w-full max-[350px]:justify-center px-2 py-2"
                      asChild
                    >
                      <Link
                        href={item.originalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Open ${item.shortUrl}`}
                      >
                        <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <ToolEmptyState
                icon={Link2}
                title="No shortened URLs yet"
                description="Create your first short link from the form and the generated URLs will appear here."
              />
            )}
          </ToolPanel>
        </div>

        <ToolPanel
          heading="Link Analytics"
          para="Review engagement details for each short link and expand a row for the full destination metadata."
          headerSlot={
            analyticsRows.length ? (
              <ToolFeaturePill
                icon={BarChart3}
                label={`${analyticsRows.length} tracked`}
              />
            ) : undefined
          }
        >
          {analyticsRows.length ? (
            <div className="space-y-5 max-[350px]:space-y-4">
              <div className="grid gap-3 max-[350px]:gap-2 sm:grid-cols-3">
                <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.22)] px-4 py-4 max-[350px]:px-3 max-[350px]:py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground)/0.85)] max-[350px]:text-[9px] max-[350px]:tracking-[0.14em]">
                    Total Clicks
                  </p>
                  <p className="mt-2 text-xl font-semibold text-[hsl(var(--foreground))] max-[350px]:text-lg lg:text-3xl">
                    {totalClicks}
                  </p>
                </div>

                <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.22)] px-4 py-4 max-[350px]:px-3 max-[350px]:py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground)/0.85)] max-[350px]:text-[9px] max-[350px]:tracking-[0.14em]">
                    Average Per Link
                  </p>
                  <p className="mt-2 text-xl font-semibold text-[hsl(var(--foreground))] max-[350px]:text-lg lg:text-3xl">
                    {Math.round(totalClicks / analyticsRows.length)}
                  </p>
                </div>

                <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.22)] px-4 py-4 max-[350px]:px-3 max-[350px]:py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground)/0.85)] max-[350px]:text-[9px] max-[350px]:tracking-[0.14em]">
                    Top Alias
                  </p>
                  <p className="mt-2 max-w-full break-all text-lg font-semibold text-[hsl(var(--foreground))] max-[350px]:text-base lg:text-3xl">
                    /{analyticsRows[0].alias}
                  </p>
                </div>
              </div>

              <div className="overflow-hidden rounded-[1.75rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
                <div className="hidden gap-4 border-b border-[hsl(var(--border))] px-5 py-3 md:grid md:grid-cols-[minmax(0,1.8fr)_90px_150px_120px_44px] xl:grid-cols-[minmax(0,1.9fr)_100px_170px_132px_48px]">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground)/0.9)]">
                    Short Link
                  </p>
                  <p className="text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground)/0.9)]">
                    Clicks
                  </p>
                  <p className="text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground)/0.9)]">
                    Created At
                  </p>
                  <p className="text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground)/0.9)]">
                    Status
                  </p>
                  <p className="text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground)/0.9)]">
                    Action
                  </p>
                </div>

                <ToolExpandableRows
                  items={analyticsRows.map((item) => ({
                    id: item.id,
                    trigger: (
                      <div className="grid gap-3 max-[350px]:gap-2 md:items-center md:grid-cols-[minmax(0,1.8fr)_90px_150px_120px_44px] xl:grid-cols-[minmax(0,1.9fr)_100px_170px_132px_48px]">
                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground)/0.78)] max-[350px]:text-[9px] max-[350px]:tracking-[0.14em] md:hidden">
                            Short Link
                          </p>
                          <p className="break-all text-sm font-medium text-[hsl(var(--primary))] leading-5 md:truncate md:break-normal max-[350px]:text-[13px]">
                            {item.shortUrl}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 max-[350px]:gap-2 min-[480px]:grid-cols-4 md:contents">
                          <div className="min-w-0 md:text-center">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground)/0.78)] max-[350px]:text-[9px] max-[350px]:tracking-[0.14em] md:hidden">
                              Clicks
                            </p>
                            <p className="text-sm font-semibold text-[hsl(var(--foreground))] max-[350px]:text-[13px]">
                              {item.clicks}
                            </p>
                          </div>

                          <div className="min-w-0 md:text-center">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground)/0.78)] max-[350px]:text-[9px] max-[350px]:tracking-[0.14em] md:hidden">
                              Created At
                            </p>
                            <p className="text-sm text-[hsl(var(--foreground))] max-[350px]:text-[13px]">
                              {item.createdAt}
                            </p>
                          </div>

                          <div className="min-w-0 items-start justify-self-end max-[480px]:justify-self-start md:items-center">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground)/0.78)] max-[350px]:text-[9px] max-[350px]:tracking-[0.14em] md:hidden">
                              Status
                            </p>
                            <ShortUrlStatusChip status={item.status} />
                          </div>

                          <div className="min-w-0 items-start justify-self-end max-[480px]:justify-self-start md:items-center md:justify-self-center">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground)/0.78)] max-[350px]:text-[9px] max-[350px]:tracking-[0.14em] md:hidden">
                              Action
                            </p>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              data-row-action="true"
                              onClick={() => openDeleteModal(item)}
                              aria-label={`Delete ${item.shortUrl}`}
                              className="h-7 w-7 rounded-full border border-rose-200/80 text-rose-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 md:h-9 md:w-9 dark:border-rose-400/20 dark:text-rose-300 dark:hover:border-rose-400/30 dark:hover:bg-rose-400/10 dark:hover:text-rose-200"
                            >
                              <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ),
                    content: (
                      <div className="pb-4 max-[350px]:pb-3">
                        <div className="rounded-b-2xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.34)] p-4 max-[350px]:p-3 dark:bg-[hsl(var(--secondary)/0.42)]">
                          <div className="grid gap-3 max-[350px]:gap-2 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1.15fr)_minmax(0,1fr)_minmax(0,0.8fr)]">
                            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3.5 max-[350px]:px-3 max-[350px]:py-3">
                              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground)/0.9)] max-[350px]:text-[9px] max-[350px]:tracking-[0.14em]">
                                Destination URL
                              </p>
                              <p
                                title={item.originalUrl}
                                className="mt-2 break-all text-xs leading-5 text-[hsl(var(--foreground))] sm:truncate sm:break-normal max-[350px]:text-[11px]"
                              >
                                {item.originalUrl}
                              </p>
                            </div>

                            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3.5 max-[350px]:px-3 max-[350px]:py-3">
                              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground)/0.9)] max-[350px]:text-[9px] max-[350px]:tracking-[0.14em]">
                                Short URL
                              </p>
                              <p
                                title={item.shortUrl}
                                className="mt-2 break-all text-xs leading-5 text-[hsl(var(--primary))] sm:truncate sm:break-normal max-[350px]:text-[11px]"
                              >
                                {item.shortUrl}
                              </p>
                            </div>

                            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3.5 max-[350px]:px-3 max-[350px]:py-3">
                              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground)/0.9)] max-[350px]:text-[9px] max-[350px]:tracking-[0.14em]">
                                Alias
                              </p>
                              <p className="mt-2 break-all text-xs leading-5 text-[hsl(var(--foreground))] sm:truncate sm:break-normal max-[350px]:text-[11px]">
                                /{item.alias}
                              </p>
                            </div>

                            <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3.5 max-[350px]:px-3 max-[350px]:py-3">
                              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground)/0.9)] max-[350px]:text-[9px] max-[350px]:tracking-[0.14em]">
                                Clicks
                              </p>
                              <p className="mt-2 text-lg font-semibold leading-none text-[hsl(var(--foreground))] max-[350px]:text-base sm:text-xl">
                                {item.clicks}
                              </p>
                            </div>
                          </div>

                          <div className="flex justify-between gap-3 max-[840px]:flex-col">
                            <div className="mt-4 flex flex-wrap gap-2.5 max-[350px]:mt-3 max-[350px]:gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="max-[350px]:w-full max-[350px]:justify-center"
                                asChild
                              >
                                <Link
                                  href={item.shortUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="max-sm:text-xs max-[350px]:w-full max-[350px]:justify-center max-[350px]:text-[11px]"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                  Open Short URL
                                </Link>
                              </Button>

                              <Button
                                variant="outline"
                                size="sm"
                                className="max-[350px]:w-full max-[350px]:justify-center"
                                asChild
                              >
                                <Link
                                  href={item.originalUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="max-sm:text-xs max-[350px]:w-full max-[350px]:justify-center max-[350px]:text-[11px]"
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                  Open Destination
                                </Link>
                              </Button>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2 max-[350px]:mt-3 max-[350px]:flex-col max-[350px]:items-start max-[350px]:gap-1.5">
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--secondary)/0.82)] px-3 py-1.5 text-[10px] font-medium text-[hsl(var(--muted-foreground))] max-[350px]:px-2.5 max-[350px]:py-1 max-[350px]:text-[9px] dark:bg-[hsl(var(--secondary)/0.72)]">
                                <CalendarDays className="h-3.5 w-3.5" />
                                {item.createdAt}
                              </span>
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--secondary)/0.82)] px-3 py-1.5 text-[10px] font-medium text-[hsl(var(--muted-foreground))] max-[350px]:px-2.5 max-[350px]:py-1 max-[350px]:text-[9px] dark:bg-[hsl(var(--secondary)/0.72)]">
                                <BarChart3 className="h-3.5 w-3.5" />
                                {item.clicks} clicks
                              </span>
                              <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--secondary)/0.82)] px-3 py-1.5 text-[10px] font-medium text-[hsl(var(--muted-foreground))] max-[350px]:px-2.5 max-[350px]:py-1 max-[350px]:text-[9px] dark:bg-[hsl(var(--secondary)/0.72)]">
                                /{item.alias}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ),
                  }))}
                  initialOpenId={analyticsRows[0]?.id ?? null}
                  listClassName="divide-[hsl(var(--border))]"
                  rowClassName="bg-[hsl(var(--card))]"
                  triggerClassName="px-5 py-4 transition-colors duration-200 max-[350px]:px-3 max-[350px]:py-3.5"
                  openTriggerClassName="bg-[hsl(var(--secondary)/0.4)] dark:bg-[hsl(var(--secondary)/0.5)]"
                  closedTriggerClassName="hover:bg-[hsl(var(--secondary)/0.28)] dark:hover:bg-[hsl(var(--secondary)/0.4)]"
                />
              </div>
            </div>
          ) : (
            <ToolEmptyState
              icon={BarChart3}
              title="No analytics yet"
              description="Create a short link first and its analytics details will appear here with filters and metrics."
            />
          )}
        </ToolPanel>
      </ToolPageShell>

      <ToolConfirmModal
        isOpen={Boolean(deleteTarget)}
        eyebrow="Delete Link"
        title="Confirm removal"
        subjectLabel="You are about to delete:"
        subjectValue={deleteTarget?.shortUrl ?? ""}
        confirmValue={deleteConfirmValue}
        confirmKeyword="confirm"
        confirmLabel="Delete Link"
        onConfirmValueChange={setDeleteConfirmValue}
        onClose={closeDeleteModal}
        onConfirm={closeDeleteModal}
      />
    </>
  );
};

export default URLShortener;
