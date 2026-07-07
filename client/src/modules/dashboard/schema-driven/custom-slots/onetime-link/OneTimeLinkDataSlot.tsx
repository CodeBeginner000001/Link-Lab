"use client";

import { Button } from "@/components/ui/Button";
import { formatDate, formatDateTime } from "@/utils/date-time-helper";
import { cn } from "@/utils/tailwindcss-merger";
import {
  CalendarDays,
  ExternalLink,
  KeyRound,
  Link2,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import ToolEmptyState from "../../../component/ToolEmptyState";
import ToolExpandableRows from "../../../component/ToolExpandableRows";
import type { SchemaDeleteAction } from "../../types";
import SchemaDeleteModal from "@/modules/dashboard/component/SchemaDeleteModal";

type OneTimeLinkDataSlotProps = {
  items: Record<string, unknown>[];
  deleteAction?: SchemaDeleteAction;
};

type OneTimeLinkItem = {
  id: string;
  alias: string;
  originalUrl: string;
  oneTimeUrl: string;
  status: string;
  usedAt: string | null;
  createdAt: string | null;
  passwordProtected: boolean;
};

function toOneTimeLinkItem(
  item: Record<string, unknown>,
  index: number,
): OneTimeLinkItem {
  const alias = String(item.alias ?? "");

  return {
    id: String(item.id ?? alias ?? index),
    alias,
    originalUrl: String(item.originalUrl ?? "-"),
    oneTimeUrl: String(item.oneTimeUrl ?? ""),
    status: String(item.status ?? "active"),
    usedAt: typeof item.usedAt === "string" ? item.usedAt : null,
    createdAt: typeof item.createdAt === "string" ? item.createdAt : null,
    passwordProtected: Boolean(item.passwordProtected),
  };
}

function getVisitHref(item: OneTimeLinkItem) {
  return item.alias
    ? `/api/ot/${encodeURIComponent(item.alias)}`
    : item.oneTimeUrl || "#";
}

function OneTimeStatusChip({ status }: { status: string }) {
  const isActive = status === "active";
  const isUsed = status === "used";

  return (
    <span
      className={cn(
        "inline-flex w-fit items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-[10px] font-semibold capitalize",
        isActive &&
          "border-emerald-600/20 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200",
        isUsed &&
          "border-amber-600/20 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200",
        !isActive &&
          !isUsed &&
          "border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.5)] text-[hsl(var(--muted-foreground))]",
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

export default function OneTimeLinkDataSlot({
  items,
  deleteAction,
}: OneTimeLinkDataSlotProps) {
  const rows = useMemo(
    () => items.map((item, index) => toOneTimeLinkItem(item, index)),
    [items],
  );

  if (!rows.length) {
    return (
      <ToolEmptyState
        icon={ShieldCheck}
        title="No one-time links yet"
        description="Generate your first one-time link from the form and it will appear here."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-[1.75rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
      <div className="hidden gap-4 border-b border-[hsl(var(--border))] px-5 py-3 md:grid md:grid-cols-[minmax(0,1.6fr)_120px_120px_150px_96px]">
        {["Link", "Protection", "Status", "Created", "Actions"].map((label) => (
          <p
            key={label}
            className="text-center text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground)/0.9)] first:text-left"
          >
            {label}
          </p>
        ))}
      </div>

      <ToolExpandableRows
        items={rows.map((item) => ({
          id: item.id,
          trigger: (
            <div className="grid gap-3 md:grid-cols-[minmax(0,1.6fr)_120px_120px_150px_96px] md:items-center">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground)/0.78)] md:hidden">
                  Link
                </p>
                <p className="truncate text-sm font-semibold text-[hsl(var(--primary))]">
                  /api/ot/{item.alias}
                </p>
                <p
                  title={item.originalUrl}
                  className="mt-1 truncate text-xs text-[hsl(var(--muted-foreground))]"
                >
                  {item.originalUrl}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 min-[520px]:grid-cols-4 md:contents">
                <div className="min-w-0 md:text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground)/0.78)] md:hidden">
                    Protection
                  </p>
                  <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[hsl(var(--secondary)/0.72)] px-2.5 py-1 text-[10px] font-semibold text-[hsl(var(--muted-foreground))]">
                    {item.passwordProtected ? (
                      <KeyRound className="h-3 w-3" />
                    ) : (
                      <ShieldCheck className="h-3 w-3" />
                    )}
                    {item.passwordProtected ? "Password" : "Open"}
                  </span>
                </div>

                <div className="min-w-0 md:flex md:justify-center">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground)/0.78)] md:hidden">
                    Status
                  </p>
                  <OneTimeStatusChip status={item.status} />
                </div>

                <div className="min-w-0 md:text-center">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground)/0.78)] md:hidden">
                    Created
                  </p>
                  <p className="text-sm text-[hsl(var(--foreground))]">
                    {formatDate(item.createdAt)}
                  </p>
                </div>

                <div className="flex items-start gap-2 md:justify-center">
                  <p className="sr-only">Actions</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    data-row-action="true"
                    aria-label={`Visit ${item.oneTimeUrl || item.alias}`}
                    className="h-8 w-8 rounded-full border border-[hsl(var(--border))]"
                    asChild
                  >
                    <Link
                      href={getVisitHref(item)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </Button>
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
                          aria-label={`Delete ${item.oneTimeUrl || item.alias}`}
                          className="h-8 w-8 rounded-full border border-rose-200/80 text-rose-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-400/20 dark:text-rose-300 dark:hover:border-rose-400/30 dark:hover:bg-rose-400/10 dark:hover:text-rose-200"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      }
                    />
                  ) : null}
                </div>
              </div>
            </div>
          ),
          content: (
            <div className="pb-4">
              <div className="rounded-b-2xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.34)] p-4 dark:bg-[hsl(var(--secondary)/0.42)]">
                <div className="grid gap-3 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1.2fr)_minmax(0,0.8fr)]">
                  <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3.5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground)/0.9)]">
                      One-Time Link
                    </p>
                    <p
                      title={item.oneTimeUrl}
                      className="mt-2 truncate text-xs leading-5 text-[hsl(var(--primary))]"
                    >
                      {getVisitHref(item)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3.5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground)/0.9)]">
                      Destination
                    </p>
                    <p
                      title={item.originalUrl}
                      className="mt-2 truncate text-xs leading-5 text-[hsl(var(--foreground))]"
                    >
                      {item.originalUrl}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-4 py-3.5">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground)/0.9)]">
                      Used
                    </p>
                    <p className="mt-2 text-xs leading-5 text-[hsl(var(--foreground))]">
                      {formatDateTime(item.usedAt)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2.5">
                  <Button variant="outline" size="sm" asChild>
                    <Link
                      href={getVisitHref(item)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      Visit One-Time Link
                    </Link>
                  </Button>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--secondary)/0.82)] px-3 py-1.5 text-[10px] font-medium text-[hsl(var(--muted-foreground))]">
                    <CalendarDays className="h-3.5 w-3.5" />
                    {formatDate(item.createdAt)}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[hsl(var(--secondary)/0.82)] px-3 py-1.5 text-[10px] font-medium text-[hsl(var(--muted-foreground))]">
                    <Link2 className="h-3.5 w-3.5" />
                    /api/ot/{item.alias}
                  </span>
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
