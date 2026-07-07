"use client";

import { Button } from "@/components/ui/Button";
import SchemaDeleteModal from "@/modules/dashboard/component/SchemaDeleteModal";
import { useToastNotification } from "@/utils/toast";
import { Archive, FileText, Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import type { SchemaDeleteAction } from "../../types";

type BulkBarcodeUploadRowSlotProps = {
  item: Record<string, unknown>;
  deleteAction?: SchemaDeleteAction;
};

function formatDate(value: unknown) {
  if (typeof value !== "string" || !value) {
    return "-";
  }

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function downloadUrl(id: string, type: "zip" | "pdf") {
  return `/api/features/bulk-barcodes/${encodeURIComponent(id)}/download?type=${type}`;
}

async function refreshAccessToken() {
  const response = await fetch("/api/auth/backend/refresh-token", {
    method: "POST",
    credentials: "include",
  });

  return response.ok;
}

async function fetchBulkBarcodeExport(id: string, type: "zip" | "pdf") {
  return fetch(downloadUrl(id, type), {
    credentials: "include",
    cache: "no-store",
  });
}

function getDownloadFilename(disposition: string | null, fallback: string) {
  if (!disposition) {
    return fallback;
  }

  const encodedMatch = disposition.match(/filename\*=UTF-8''([^;]+)/i);

  if (encodedMatch?.[1]) {
    try {
      return decodeURIComponent(encodedMatch[1]);
    } catch {
      return fallback;
    }
  }

  const quotedMatch = disposition.match(/filename="([^"]+)"/i);

  if (quotedMatch?.[1]) {
    return quotedMatch[1];
  }

  const plainMatch = disposition.match(/filename=([^;]+)/i);

  return plainMatch?.[1]?.trim() || fallback;
}

async function downloadBulkBarcode(id: string, type: "zip" | "pdf") {
  let response = await fetchBulkBarcodeExport(id, type);

  if (response.status === 401 && (await refreshAccessToken())) {
    response = await fetchBulkBarcodeExport(id, type);
  }

  if (!response.ok) {
    throw new Error("Download failed");
  }

  const blob = await response.blob();
  const filename = getDownloadFilename(
    response.headers.get("content-disposition"),
    `bulk-barcodes-${id}.${type}`,
  );
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = objectUrl;
  link.download = filename;
  link.rel = "noopener";
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  link.remove();

  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 30_000);
}

export default function BulkBarcodeUploadRowSlot({
  item,
  deleteAction,
}: BulkBarcodeUploadRowSlotProps) {
  const notify = useToastNotification();
  const [downloadingType, setDownloadingType] = useState<"zip" | "pdf" | null>(
    null,
  );
  const id = String(item.id ?? "");
  const fileName = String(item.fileName ?? "-");
  const totalRows = Number(item.totalRows ?? 0);
  const generatedCount = Number(item.generatedCount ?? 0);
  const failedCount = Number(item.failedCount ?? 0);

  const handleDownload = async (type: "zip" | "pdf") => {
    if (!id || downloadingType) {
      return;
    }

    setDownloadingType(type);

    try {
      await downloadBulkBarcode(id, type);
    } catch {
      notify("Unable to download this export. Please try again.", "error");
    } finally {
      setDownloadingType(null);
    }
  };

  return (
    <article className="grid gap-3 bg-[hsl(var(--card))] px-4 py-3 text-sm lg:grid-cols-[minmax(180px,1.3fr)_100px_100px_80px_130px_230px] lg:items-center">
      <div className="min-w-0">
        <p className="truncate font-medium">{fileName}</p>
        <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))] lg:hidden">
          {totalRows} rows · {generatedCount} success · {failedCount} fails
        </p>
      </div>

      <span className="hidden text-center text-[hsl(var(--muted-foreground))] lg:block">
        {totalRows}
      </span>
      <span className="hidden text-center font-semibold text-emerald-600 lg:block">
        {generatedCount}
      </span>
      <span className="hidden text-center font-semibold text-rose-600 lg:block">
        {failedCount}
      </span>
      <span className="hidden text-center text-[hsl(var(--muted-foreground))] lg:block">
        {formatDate(item.createdAt)}
      </span>

      <div className="flex flex-wrap items-center gap-2 lg:justify-center">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-[4.75rem] flex-none"
          disabled={!id || downloadingType !== null}
          onClick={() => handleDownload("zip")}
          aria-label={downloadingType === "zip" ? "Preparing ZIP download" : "Download ZIP"}
        >
          {downloadingType === "zip" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Archive className="h-3.5 w-3.5" />
          )}
          <span className="w-7 text-center">ZIP</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-[4.75rem] flex-none"
          disabled={!id || downloadingType !== null}
          onClick={() => handleDownload("pdf")}
          aria-label={downloadingType === "pdf" ? "Preparing PDF download" : "Download PDF"}
        >
          {downloadingType === "pdf" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <FileText className="h-3.5 w-3.5" />
          )}
          <span className="w-7 text-center">PDF</span>
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
                className="h-8 w-8 text-[hsl(var(--muted-foreground))] hover:text-rose-600"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            }
          />
        ) : null}
      </div>
    </article>
  );
}
