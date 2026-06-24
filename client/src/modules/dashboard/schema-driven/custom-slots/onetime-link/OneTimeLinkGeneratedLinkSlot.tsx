"use client";

import { Button } from "@/components/ui/Button";
import { ExternalLink, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import ToolEmptyState from "../../../component/ToolEmptyState";

type OneTimeLinkGeneratedLinkSlotProps = {
  items: Record<string, unknown>[];
};

type OneTimeLinkPreview = {
  id: string;
  alias: string;
  oneTimeUrl: string;
  originalUrl: string;
  passwordProtected: boolean;
};

function toRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function getGeneratedLink(response: unknown): OneTimeLinkPreview | null {
  const payload = toRecord(response);
  const data = toRecord(payload?.data);
  const oneTimeLink = toRecord(data?.oneTimeLink ?? payload?.oneTimeLink);

  if (!oneTimeLink) {
    return null;
  }

  const alias = String(oneTimeLink.alias ?? "");

  return {
    id: String(oneTimeLink.id ?? alias),
    alias,
    oneTimeUrl: String(oneTimeLink.oneTimeUrl ?? ""),
    originalUrl: String(oneTimeLink.originalUrl ?? ""),
    passwordProtected: Boolean(oneTimeLink.passwordProtected),
  };
}

function toPreview(item: Record<string, unknown>, index: number) {
  const alias = String(item.alias ?? "");

  return {
    id: String(item.id ?? alias ?? index),
    alias,
    oneTimeUrl: String(item.oneTimeUrl ?? ""),
    originalUrl: String(item.originalUrl ?? ""),
    passwordProtected: Boolean(item.passwordProtected),
  } satisfies OneTimeLinkPreview;
}

function getVisitHref(item: OneTimeLinkPreview) {
  return item.oneTimeUrl || `/ot/${encodeURIComponent(item.alias)}`;
}

export default function OneTimeLinkGeneratedLinkSlot({
  items,
}: OneTimeLinkGeneratedLinkSlotProps) {
  const initialLinks = useMemo(
    () => items.slice(0, 4).map((item, index) => toPreview(item, index)),
    [items],
  );
  const [generatedLinks, setGeneratedLinks] =
    useState<OneTimeLinkPreview[]>(initialLinks);

  useEffect(() => {
    setGeneratedLinks(initialLinks);
  }, [initialLinks]);

  useEffect(() => {
    const handleCreated = (event: Event) => {
      const response = (event as CustomEvent<{ response?: unknown }>).detail
        ?.response;
      const generatedLink = getGeneratedLink(response);

      if (!generatedLink) {
        return;
      }

      setGeneratedLinks((current) => [
        generatedLink,
        ...current.filter((item) => item.id !== generatedLink.id),
      ]);
    };

    window.addEventListener("onetime-link-created", handleCreated);
    return () =>
      window.removeEventListener("onetime-link-created", handleCreated);
  }, []);

  if (!generatedLinks.length) {
    return (
      <ToolEmptyState
        icon={ShieldCheck}
        title="No one-time links yet"
        description="Create a one-time link and the latest generated links will appear here."
        className="min-h-[220px]"
      />
    );
  }

  return (
    <div className="space-y-3">
      {generatedLinks.slice(0, 4).map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-3 max-[460px]:flex-col max-[460px]:items-start"
        >
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-[hsl(var(--primary))]">
              {item.oneTimeUrl || `/ot/${item.alias}`}
            </p>
            <p className="mt-1 truncate text-xs text-[hsl(var(--muted-foreground))]">
              {item.passwordProtected ? "Password protected" : "Single use"} ·{" "}
              {item.originalUrl}
            </p>
          </div>
          <Button
            variant="outline"
            className="h-8 px-2 py-2 max-[460px]:w-full"
            asChild
          >
            <Link
              href={getVisitHref(item)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Visit ${item.oneTimeUrl || "one-time link"}`}
            >
              <ExternalLink className="h-4 w-4" />
              Visit
            </Link>
          </Button>
        </div>
      ))}
    </div>
  );
}
