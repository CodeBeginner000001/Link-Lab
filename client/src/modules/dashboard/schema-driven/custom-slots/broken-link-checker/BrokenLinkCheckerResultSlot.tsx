"use client";

import { Button } from "@/components/ui/Button";
import ToolEmptyState from "@/modules/dashboard/component/ToolEmptyState";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  SearchCheck,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type LinkCheck = {
  id: string;
  url: string;
  finalUrl: string;
  statusCode: number | null;
  status: string;
  isBroken: boolean;
  isUnsafe: boolean;
  safetyStatus: string;
  safetyProvider: string | null;
  threatTypes: string[];
  contentType: string | null;
  contentLength: number | null;
  contentDisposition: string | null;
  errorMessage: string | null;
  redirectCount: number;
};

type BrokenLinkCheckerResultSlotProps = {
  items: Record<string, unknown>[];
};

function toLinkCheck(item: Record<string, unknown>): LinkCheck {
  return {
    id: String(item.id ?? ""),
    url: String(item.url ?? "-"),
    finalUrl: String(item.finalUrl ?? item.url ?? "-"),
    statusCode:
      typeof item.statusCode === "number" ? item.statusCode : null,
    status: String(item.status ?? "broken"),
    isBroken: Boolean(item.isBroken),
    isUnsafe: Boolean(item.isUnsafe),
    safetyStatus: String(item.safetyStatus ?? "unchecked"),
    safetyProvider:
      typeof item.safetyProvider === "string" ? item.safetyProvider : null,
    threatTypes: Array.isArray(item.threatTypes)
      ? item.threatTypes.map((threatType) => String(threatType))
      : [],
    contentType: typeof item.contentType === "string" ? item.contentType : null,
    contentLength:
      typeof item.contentLength === "number" ? item.contentLength : null,
    contentDisposition:
      typeof item.contentDisposition === "string"
        ? item.contentDisposition
        : null,
    errorMessage:
      typeof item.errorMessage === "string" ? item.errorMessage : null,
    redirectCount: Number(item.redirectCount ?? 0) || 0,
  };
}

function getLinkCheckFromResponse(response: unknown) {
  if (!response || typeof response !== "object") {
    return null;
  }

  const record = response as Record<string, unknown>;
  const data = record.data;
  const payload =
    data && typeof data === "object"
      ? (data as Record<string, unknown>).linkCheck
      : record.linkCheck;

  return payload && typeof payload === "object"
    ? toLinkCheck(payload as Record<string, unknown>)
    : null;
}

function getSafetyLabel(result: LinkCheck) {
  if (result.isUnsafe) {
    return "Known threat detected";
  }

  if (result.safetyStatus === "no_known_threat") {
    return "No known threat found";
  }

  return "Safety unchecked";
}

function getSafetyHelp(result: LinkCheck) {
  if (result.isUnsafe) {
    return result.threatTypes.length
      ? `Flagged for ${result.threatTypes.join(", ")}. Do not open this link.`
      : "Do not open this link.";
  }

  if (result.safetyStatus === "no_known_threat") {
    return "The configured provider did not report this URL as malware, phishing, or unwanted software.";
  }

  return "No reputation provider result is available, so this app will not offer a direct open action.";
}

function formatBytes(value: number | null) {
  if (value === null) {
    return "N/A";
  }

  if (value < 1024) {
    return `${value} B`;
  }

  if (value < 1024 * 1024) {
    return `${(value / 1024).toFixed(1)} KB`;
  }

  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

export default function BrokenLinkCheckerResultSlot({
  items,
}: BrokenLinkCheckerResultSlotProps) {
  const latestFromItems = useMemo(
    () => (items[0] ? toLinkCheck(items[0]) : null),
    [items],
  );
  const [latestResult, setLatestResult] = useState<LinkCheck | null>(
    latestFromItems,
  );

  useEffect(() => {
    setLatestResult(latestFromItems);
  }, [latestFromItems]);

  useEffect(() => {
    const handleSuccess = (event: Event) => {
      const customEvent = event as CustomEvent<{ response?: unknown }>;
      const linkCheck = getLinkCheckFromResponse(customEvent.detail?.response);

      if (linkCheck) {
        setLatestResult(linkCheck);
      }
    };

    window.addEventListener("broken-link-checker-data-changed", handleSuccess);
    return () =>
      window.removeEventListener(
        "broken-link-checker-data-changed",
        handleSuccess,
      );
  }, []);

  if (!latestResult) {
    return (
      <ToolEmptyState
        icon={SearchCheck}
        title="No link checked yet"
        description="Check a URL and its health result will appear here."
        className="min-h-[220px]"
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.35)] p-4">
        <div className="flex items-center gap-2">
          {latestResult.isUnsafe || latestResult.isBroken ? (
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          )}
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
            {latestResult.isUnsafe
              ? "Unsafe link blocked"
              : latestResult.isBroken
                ? "Link appears broken"
                : "Link is working"}
          </p>
        </div>

        <p className="mt-3 break-all text-sm font-semibold leading-6 text-[hsl(var(--foreground))]">
          {latestResult.finalUrl}
        </p>

        {latestResult.errorMessage ? (
          <p className="mt-2 text-xs leading-5 text-[hsl(var(--muted-foreground))]">
            {latestResult.errorMessage}
          </p>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[hsl(var(--border))] px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
            Status Code
          </p>
          <p className="mt-2 text-xs font-semibold text-[hsl(var(--foreground))]">
            {latestResult.statusCode ?? "N/A"}
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
        <div className="rounded-2xl border border-[hsl(var(--border))] px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
            Result
          </p>
          <p className="mt-2 text-xs font-semibold capitalize text-[hsl(var(--foreground))]">
            {latestResult.status}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-[hsl(var(--border))] px-4 py-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
          Safety
        </p>
        <p className="mt-2 text-xs font-semibold text-[hsl(var(--foreground))]">
          {getSafetyLabel(latestResult)}
        </p>
        <p className="mt-1 text-xs leading-5 text-[hsl(var(--muted-foreground))]">
          {getSafetyHelp(latestResult)}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-[hsl(var(--border))] px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
            Content Type
          </p>
          <p className="mt-2 truncate text-xs font-semibold text-[hsl(var(--foreground))]">
            {latestResult.contentType ?? "N/A"}
          </p>
        </div>
        <div className="rounded-2xl border border-[hsl(var(--border))] px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))]">
            Content Length
          </p>
          <p className="mt-2 text-xs font-semibold text-[hsl(var(--foreground))]">
            {formatBytes(latestResult.contentLength)}
          </p>
        </div>
      </div>

      {!latestResult.isBroken &&
      !latestResult.isUnsafe &&
      latestResult.safetyStatus === "no_known_threat" ? (
        <Button variant="outline" asChild>
          <Link
            href={latestResult.finalUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <ExternalLink className="h-4 w-4" />
            Open Link
          </Link>
        </Button>
      ) : (
        <p className="text-xs leading-5 text-[hsl(var(--muted-foreground))]">
          Direct opening is disabled for broken, unsafe, or unchecked links.
        </p>
      )}
    </div>
  );
}
