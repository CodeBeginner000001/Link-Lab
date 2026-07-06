"use client";

import { Button } from "@/components/ui/Button";
import SchemaDeleteModal from "@/modules/dashboard/component/SchemaDeleteModal";
import ToolEmptyState from "@/modules/dashboard/component/ToolEmptyState";
import { formatDate } from "@/utils/date-time-helper";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  SearchCheck,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import type { SchemaDeleteAction } from "../../types";

type BrokenLinkCheckerDataSlotProps = {
  items: Record<string, unknown>[];
  deleteAction?: SchemaDeleteAction;
};

type LinkCheckRow = {
  id: string;
  url: string;
  finalUrl: string;
  statusCode: number | null;
  status: string;
  isBroken: boolean;
  isUnsafe: boolean;
  safetyStatus: string;
  threatTypes: string[];
  contentType: string | null;
  errorMessage: string | null;
  createdAt: string | null;
};

function toLinkCheckRow(
  item: Record<string, unknown>,
  index: number,
): LinkCheckRow {
  return {
    id: String(item.id ?? index),
    url: String(item.url ?? "-"),
    finalUrl: String(item.finalUrl ?? item.url ?? "-"),
    statusCode:
      typeof item.statusCode === "number" ? item.statusCode : null,
    status: String(item.status ?? "broken"),
    isBroken: Boolean(item.isBroken),
    isUnsafe: Boolean(item.isUnsafe),
    safetyStatus: String(item.safetyStatus ?? "unchecked"),
    threatTypes: Array.isArray(item.threatTypes)
      ? item.threatTypes.map((threatType) => String(threatType))
      : [],
    contentType: typeof item.contentType === "string" ? item.contentType : null,
    errorMessage:
      typeof item.errorMessage === "string" ? item.errorMessage : null,
    createdAt: typeof item.createdAt === "string" ? item.createdAt : null,
  };
}

function StatusChip({ item }: { item: LinkCheckRow }) {
  if (item.isUnsafe) {
    return (
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-rose-600/20 bg-rose-50 px-2.5 py-1 text-[10px] font-semibold text-rose-700 dark:border-rose-400/20 dark:bg-rose-400/10 dark:text-rose-200">
        <AlertTriangle className="h-3 w-3" />
        Unsafe
      </span>
    );
  }

  return (
    <span
      className={
        item.isBroken
          ? "inline-flex w-fit items-center gap-1.5 rounded-full border border-amber-600/20 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200"
          : "inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-600/20 bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200"
      }
    >
      {item.isBroken ? (
        <AlertTriangle className="h-3 w-3" />
      ) : (
        <CheckCircle2 className="h-3 w-3" />
      )}
      {item.isBroken ? "Broken" : "Working"}
    </span>
  );
}

function SafetyText({ item }: { item: LinkCheckRow }) {
  if (item.isUnsafe) {
    return (
      <p className="mt-1 truncate text-xs text-rose-600 dark:text-rose-300">
        {item.threatTypes.length
          ? item.threatTypes.join(", ")
          : "Known threat detected"}
      </p>
    );
  }

  if (item.safetyStatus === "no_known_threat") {
    return (
      <p className="mt-1 truncate text-xs text-emerald-600 dark:text-emerald-300">
        No known threat
      </p>
    );
  }

  return (
    <p className="mt-1 truncate text-xs text-[hsl(var(--muted-foreground))]">
      Safety unchecked
    </p>
  );
}

export default function BrokenLinkCheckerDataSlot({
  items,
  deleteAction,
}: BrokenLinkCheckerDataSlotProps) {
  const rows = useMemo(
    () => items.map((item, index) => toLinkCheckRow(item, index)),
    [items],
  );

  if (!rows.length) {
    return (
      <ToolEmptyState
        icon={SearchCheck}
        title="No links checked yet"
        description="Check your first URL from the form and recent results will appear here."
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
      <div className="hidden border-b border-[hsl(var(--border))] px-5 py-3 md:grid md:grid-cols-[minmax(0,1.35fr)_100px_110px_120px_84px] md:gap-4">
        {["URL", "Code", "Status", "Created", "Action"].map((label) => (
          <p
            key={label}
            className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]"
          >
            {label}
          </p>
        ))}
      </div>

      <div className="divide-y divide-[hsl(var(--border))]">
        {rows.map((item) => (
          <div
            key={item.id}
            className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(0,1.35fr)_100px_110px_120px_84px] md:items-center md:gap-4"
          >
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))] md:hidden">
                URL
              </p>
              <p className="truncate text-sm font-medium text-[hsl(var(--foreground))]">
                {item.url}
              </p>
              {item.errorMessage ? (
                <p className="mt-1 truncate text-xs text-[hsl(var(--muted-foreground))]">
                  {item.errorMessage}
                </p>
              ) : null}
              <SafetyText item={item} />
              {item.contentType ? (
                <p className="mt-1 truncate text-xs text-[hsl(var(--muted-foreground))]">
                  {item.contentType}
                </p>
              ) : null}
            </div>

            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))] md:hidden">
                Code
              </p>
              <p className="text-sm font-semibold text-[hsl(var(--foreground))]">
                {item.statusCode ?? "N/A"}
              </p>
            </div>

            <div>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))] md:hidden">
                Status
              </p>
              <StatusChip item={item} />
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
              {!item.isBroken &&
              !item.isUnsafe &&
              item.safetyStatus === "no_known_threat" ? (
                <Button variant="outline" size="icon" asChild>
                  <Link
                    href={item.finalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open ${item.finalUrl}`}
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
