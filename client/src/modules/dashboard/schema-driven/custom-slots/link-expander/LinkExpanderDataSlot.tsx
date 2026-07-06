"use client";

import { Button } from "@/components/ui/Button";
import SchemaDeleteModal from "@/modules/dashboard/component/SchemaDeleteModal";
import ToolEmptyState from "@/modules/dashboard/component/ToolEmptyState";
import { formatDate } from "@/utils/date-time-helper";
import {
  ExternalLink,
  SearchCheck,
  ShieldCheck,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import type { SchemaDeleteAction } from "../../types";

type LinkExpanderDataSlotProps = {
  items: Record<string, unknown>[];
  deleteAction?: SchemaDeleteAction;
};

type ExpandedLinkRow = {
  id: string;
  url: string;
  destinationUrl: string;
  status: string;
  redirectCount: number;
  errorMessage: string | null;
  createdAt: string | null;
};

function toExpandedLinkRow(
  item: Record<string, unknown>,
  index: number,
): ExpandedLinkRow {
  return {
    id: String(item.id ?? index),
    url: String(item.url ?? "-"),
    destinationUrl: String(item.destinationUrl ?? "-"),
    status: String(item.status ?? "failed"),
    redirectCount: Number(item.redirectCount ?? 0) || 0,
    errorMessage:
      typeof item.errorMessage === "string" ? item.errorMessage : null,
    createdAt: typeof item.createdAt === "string" ? item.createdAt : null,
  };
}

function StatusChip({ status }: { status: string }) {
  const isSuccessful = status === "success";

  return (
    <span
      className={
        isSuccessful
          ? "inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-600/20 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200"
          : "inline-flex w-fit items-center gap-1.5 rounded-full border border-amber-600/20 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200"
      }
    >
      {isSuccessful ? (
        <ShieldCheck className="h-3 w-3" />
      ) : (
        <TriangleAlert className="h-3 w-3" />
      )}
      {isSuccessful ? "Success" : "Failed"}
    </span>
  );
}

export default function LinkExpanderDataSlot({
  items,
  deleteAction,
}: LinkExpanderDataSlotProps) {
  const rows = useMemo(
    () => items.map((item, index) => toExpandedLinkRow(item, index)),
    [items],
  );

  if (!rows.length) {
    return (
      <ToolEmptyState
        icon={SearchCheck}
        title="No expanded links yet"
        description="Expand your first link from the form and recent lookups will appear here."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
      <div className="hidden border-b border-[hsl(var(--border))] px-5 py-3 md:grid md:grid-cols-[minmax(0,1.45fr)_100px_110px_120px_84px] md:gap-4">
        {["Source", "Redirects", "Status", "Created", "Action"].map(
          (label) => (
            <p
              key={label}
              className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]"
            >
              {label}
            </p>
          ),
        )}
      </div>

      <div className="divide-y divide-[hsl(var(--border))]">
        {rows.map((item) => (
          <div
            key={item.id}
            className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1.45fr)_100px_110px_120px_84px] md:items-center md:gap-4"
          >
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))] md:hidden">
                Source
              </p>
              <p className="truncate text-sm font-medium text-[hsl(var(--foreground))]">
                {item.url}
              </p>
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))] md:hidden">
                Redirects
              </p>
              <p className="text-sm font-semibold text-[hsl(var(--foreground))]">
                {item.redirectCount}
              </p>
              {item.errorMessage ? (
                <p className="mt-1 truncate text-xs text-[hsl(var(--muted-foreground))]">
                  {item.errorMessage}
                </p>
              ) : null}
            </div>

            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))] md:hidden">
                Status
              </p>
              <StatusChip status={item.status} />
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))] md:hidden">
                Created
              </p>
              <p className="text-sm text-[hsl(var(--foreground))]">
                {formatDate(item.createdAt)}
              </p>
            </div>

            <div className="flex items-center gap-2 md:justify-end">
              {item.status === "success" ? (
                <Button variant="outline" size="icon" asChild>
                  <Link
                    href={item.destinationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open ${item.destinationUrl}`}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Link>
                </Button>
              ) : null}

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
                      aria-label={`Delete ${item.url}`}
                      className="border border-rose-200/80 text-rose-600 hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-400/20 dark:text-rose-300 dark:hover:border-rose-400/30 dark:hover:bg-rose-400/10"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  }
                />
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
