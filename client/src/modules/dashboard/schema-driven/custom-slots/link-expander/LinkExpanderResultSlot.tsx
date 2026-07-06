"use client";

import { Button } from "@/components/ui/Button";
import ToolEmptyState from "@/modules/dashboard/component/ToolEmptyState";
import { ExternalLink, SearchCheck, ShieldCheck, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type ExpandedLink = {
  id: string;
  url: string;
  destinationUrl: string;
  status: string;
  redirectCount: number;
  errorMessage: string | null;
};

type LinkExpanderResultSlotProps = {
  items: Record<string, unknown>[];
};

function toExpandedLink(item: Record<string, unknown>): ExpandedLink {
  return {
    id: String(item.id ?? ""),
    url: String(item.url ?? "-"),
    destinationUrl: String(item.destinationUrl ?? "-"),
    status: String(item.status ?? "failed"),
    redirectCount: Number(item.redirectCount ?? 0) || 0,
    errorMessage:
      typeof item.errorMessage === "string" ? item.errorMessage : null,
  };
}

function getExpandedLinkFromResponse(response: unknown) {
  if (!response || typeof response !== "object") {
    return null;
  }

  const record = response as Record<string, unknown>;
  const data = record.data;
  const payload =
    data && typeof data === "object"
      ? (data as Record<string, unknown>).expandedLink
      : record.expandedLink;

  return payload && typeof payload === "object"
    ? toExpandedLink(payload as Record<string, unknown>)
    : null;
}

export default function LinkExpanderResultSlot({
  items,
}: LinkExpanderResultSlotProps) {
  const latestFromItems = useMemo(
    () => (items[0] ? toExpandedLink(items[0]) : null),
    [items],
  );
  const [latestResult, setLatestResult] = useState<ExpandedLink | null>(
    latestFromItems,
  );

  useEffect(() => {
    setLatestResult(latestFromItems);
  }, [latestFromItems]);

  useEffect(() => {
    const handleSuccess = (event: Event) => {
      const customEvent = event as CustomEvent<{ response?: unknown }>;
      const expandedLink = getExpandedLinkFromResponse(
        customEvent.detail?.response,
      );

      if (expandedLink) {
        setLatestResult(expandedLink);
      }
    };

    window.addEventListener("link-expander-data-changed", handleSuccess);
    return () =>
      window.removeEventListener("link-expander-data-changed", handleSuccess);
  }, []);

  if (!latestResult) {
    return (
      <ToolEmptyState
        icon={SearchCheck}
        title="No expanded link yet"
        description="Expand a short link and its destination will appear here."
        className="min-h-[220px]"
      />
    );
  }

  const isSuccessful = latestResult.status === "success";

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.35)] p-4">
        <div className="flex items-center gap-2">
          {isSuccessful ? (
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          ) : (
            <TriangleAlert className="h-4 w-4 text-amber-600" />
          )}
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
            {isSuccessful ? "Destination found" : "Expansion failed"}
          </p>
        </div>

        <p className="mt-3 break-all text-sm font-semibold leading-6 text-[hsl(var(--foreground))]">
          {latestResult.destinationUrl}
        </p>

        {latestResult.errorMessage ? (
          <p className="mt-2 text-xs leading-5 text-[hsl(var(--muted-foreground))]">
            {latestResult.errorMessage}
          </p>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-[hsl(var(--border))] px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
            Original URL
          </p>
          <p className="mt-2 truncate text-xs text-[hsl(var(--foreground))]">
            {latestResult.url}
          </p>
        </div>
        <div className="rounded-2xl border border-[hsl(var(--border))] px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
            Redirects
          </p>
          <p className="mt-2 text-xs font-semibold text-[hsl(var(--foreground))]">
            {latestResult.redirectCount}
          </p>
        </div>
      </div>

      {isSuccessful ? (
        <Button variant="outline" asChild>
          <Link
            href={latestResult.destinationUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="h-4 w-4" />
            Open Destination
          </Link>
        </Button>
      ) : null}
    </div>
  );
}
