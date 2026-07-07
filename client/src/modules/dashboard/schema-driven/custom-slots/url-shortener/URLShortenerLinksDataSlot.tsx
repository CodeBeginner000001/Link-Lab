"use client";

import { Button } from "@/components/ui/Button";
import {
  ShortUrlItem,
  ShortUrlStatus,
} from "@/service/dashboard/url-shortener/type";
import { formatDate } from "@/utils/date-time-helper";
import {
  BarChart3,
  CalendarDays,
  ExternalLink,
  Link2,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import ToolEmptyState from "../../../component/ToolEmptyState";
import ToolExpandableRows from "../../../component/ToolExpandableRows";
import type { SchemaDeleteAction } from "../../types";
import SchemaDeleteModal from "@/modules/dashboard/component/SchemaDeleteModal";

type URLShortenerLinksDataSlotProps = {
  items: Record<string, unknown>[];
  deleteAction?: SchemaDeleteAction;
};

const ShortUrlStatusChip = ({ status }: { status: ShortUrlStatus }) => (
  <span
    className={
      status === ShortUrlStatus.ACTIVE
        ? "inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-full border border-emerald-600/20 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] max-[350px]:px-2 max-[350px]:text-[9px] dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200 dark:shadow-none"
        : "inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.5)] px-2.5 py-1 text-[10px] font-semibold text-[hsl(var(--muted-foreground))] max-[350px]:px-2 max-[350px]:text-[9px]"
    }
  >
    <span className="h-1.5 w-1.5 rounded-full bg-current" />
    {status === ShortUrlStatus.ACTIVE ? "Active" : "Disabled"}
  </span>
);

const toNumber = (value: unknown) => Number(value ?? 0) || 0;
const getRedirectPath = (alias: string) =>
  `/api/r/${encodeURIComponent(alias)}`;

const toShortUrlItem = (item: Record<string, unknown>, index: number) => {
  const alias = String(item.alias ?? "");
  const clicksPersisted = toNumber(item.clicksPersisted);
  const pendingClicks = toNumber(item.pendingClicks);
  const totalClicks = toNumber(
    item.totalClicks ?? item.clicks ?? clicksPersisted + pendingClicks,
  );

  return {
    id: String(item.id ?? index),
    alias,
    longUrl: String(item.longUrl ?? "-"),
    shortUrl: String(item.shortUrl ?? "-"),
    status:
      item.status === ShortUrlStatus.DISABLED
        ? ShortUrlStatus.DISABLED
        : ShortUrlStatus.ACTIVE,
    clicksPersisted,
    pendingClicks,
    totalClicks,
    lastClickedAt:
      typeof item.lastClickedAt === "string" ? item.lastClickedAt : null,
    createdAt: typeof item.createdAt === "string" ? item.createdAt : null,
    updatedAt: typeof item.updatedAt === "string" ? item.updatedAt : null,
  } satisfies ShortUrlItem;
};

export default function URLShortenerLinksDataSlot({
  items,
  deleteAction,
}: URLShortenerLinksDataSlotProps) {
  const rows = useMemo(
    () => items.map((item, index) => toShortUrlItem(item, index)),
    [items],
  );

  if (!rows.length) {
    return (
      <ToolEmptyState
        icon={Link2}
        title="No shortened URLs yet"
        description="Create your first short link from the form and the generated URLs will appear here."
      />
    );
  }

  const handleOpenShortUrl = (item: ShortUrlItem) => {
    window.open(getRedirectPath(item.alias), "_blank", "noreferrer");
  };

  const getClicks = (item: ShortUrlItem) => item.totalClicks;

  return (
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
        items={rows.map((item) => ({
          id: item.id,
          trigger: (
            <div className="grid gap-3 max-[350px]:gap-2 md:grid-cols-[minmax(0,1.8fr)_90px_150px_120px_44px] md:items-center xl:grid-cols-[minmax(0,1.9fr)_100px_170px_132px_48px]">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground)/0.78)] max-[350px]:text-[9px] max-[350px]:tracking-[0.14em] md:hidden">
                  Short Link
                </p>
                <p className="break-all text-sm font-medium leading-5 text-[hsl(var(--primary))] max-[350px]:text-[13px] md:truncate md:break-normal">
                  {item.shortUrl}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 max-[350px]:gap-2 min-[480px]:grid-cols-4 md:contents">
                <div className="min-w-0 md:text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground)/0.78)] max-[350px]:text-[9px] max-[350px]:tracking-[0.14em] md:hidden">
                    Clicks
                  </p>
                  <p className="text-sm font-semibold text-[hsl(var(--foreground))] max-[350px]:text-[13px]">
                    {getClicks(item)}
                  </p>
                </div>

                <div className="min-w-0 md:text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground)/0.78)] max-[350px]:text-[9px] max-[350px]:tracking-[0.14em] md:hidden">
                    Created At
                  </p>
                  <p className="text-sm text-[hsl(var(--foreground))] max-[350px]:text-[13px]">
                    {formatDate(item.createdAt)}
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
                  {deleteAction ? (
                    <SchemaDeleteModal
                      action={deleteAction}
                      item={item}
                      trigger={
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          data-row-action="true"
                          aria-label={`Delete ${item.shortUrl}`}
                          className="h-7 w-7 rounded-full border border-rose-200/80 text-rose-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 md:h-9 md:w-9 dark:border-rose-400/20 dark:text-rose-300 dark:hover:border-rose-400/30 dark:hover:bg-rose-400/10 dark:hover:text-rose-200"
                        >
                          <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
                        </Button>
                      }
                    />
                  ) : null}
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
                      title={item.longUrl}
                      className="mt-2 break-all text-xs leading-5 text-[hsl(var(--foreground))] max-[350px]:text-[11px] sm:truncate sm:break-normal"
                    >
                      {item.longUrl}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3.5 max-[350px]:px-3 max-[350px]:py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground)/0.9)] max-[350px]:text-[9px] max-[350px]:tracking-[0.14em]">
                      Short URL
                    </p>
                    <p
                      title={item.shortUrl}
                      className="mt-2 break-all text-xs leading-5 text-[hsl(var(--primary))] max-[350px]:text-[11px] sm:truncate sm:break-normal"
                    >
                      {item.shortUrl}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3.5 max-[350px]:px-3 max-[350px]:py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground)/0.9)] max-[350px]:text-[9px] max-[350px]:tracking-[0.14em]">
                      Alias
                    </p>
                    <p className="mt-2 break-all text-xs leading-5 text-[hsl(var(--foreground))] max-[350px]:text-[11px] sm:truncate sm:break-normal">
                      /api/r/{item.alias}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3.5 max-[350px]:px-3 max-[350px]:py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground)/0.9)] max-[350px]:text-[9px] max-[350px]:tracking-[0.14em]">
                      Clicks
                    </p>
                    <p className="mt-2 text-lg font-semibold leading-none text-[hsl(var(--foreground))] max-[350px]:text-base sm:text-xl">
                      {getClicks(item)}
                    </p>
                  </div>
                </div>

                <div className="flex justify-between gap-3 max-[840px]:flex-col">
                  <div className="mt-4 flex flex-wrap gap-2.5 max-[350px]:mt-3 max-[350px]:gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="max-[350px]:w-full max-[350px]:justify-center max-[350px]:text-[11px] max-sm:text-xs"
                      onClick={() => handleOpenShortUrl(item)}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Open Short URL
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      className="max-[350px]:w-full max-[350px]:justify-center"
                      asChild
                    >
                      <Link
                        href={item.longUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="max-[350px]:w-full max-[350px]:justify-center max-[350px]:text-[11px] max-sm:text-xs"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Open Destination
                      </Link>
                    </Button>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2 max-[350px]:mt-3 max-[350px]:flex-col max-[350px]:items-start max-[350px]:gap-1.5">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--secondary)/0.82)] px-3 py-1.5 text-[10px] font-medium text-[hsl(var(--muted-foreground))] max-[350px]:px-2.5 max-[350px]:py-1 max-[350px]:text-[9px] dark:bg-[hsl(var(--secondary)/0.72)]">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {formatDate(item.createdAt)}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--secondary)/0.82)] px-3 py-1.5 text-[10px] font-medium text-[hsl(var(--muted-foreground))] max-[350px]:px-2.5 max-[350px]:py-1 max-[350px]:text-[9px] dark:bg-[hsl(var(--secondary)/0.72)]">
                      <BarChart3 className="h-3.5 w-3.5" />
                      {getClicks(item)} clicks
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--secondary)/0.82)] px-3 py-1.5 text-[10px] font-medium text-[hsl(var(--muted-foreground))] max-[350px]:px-2.5 max-[350px]:py-1 max-[350px]:text-[9px] dark:bg-[hsl(var(--secondary)/0.72)]">
                      /api/r/{item.alias}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ),
        }))}
        initialOpenId={rows[0]?.id ?? null}
        listClassName="divide-[hsl(var(--border))]"
        rowClassName="bg-[hsl(var(--card))]"
        triggerClassName="px-5 py-4 transition-colors duration-200 max-[350px]:px-3 max-[350px]:py-3.5"
        openTriggerClassName="bg-[hsl(var(--secondary)/0.4)] dark:bg-[hsl(var(--secondary)/0.5)]"
        closedTriggerClassName="hover:bg-[hsl(var(--secondary)/0.28)] dark:hover:bg-[hsl(var(--secondary)/0.4)]"
      />
    </div>
  );
}
