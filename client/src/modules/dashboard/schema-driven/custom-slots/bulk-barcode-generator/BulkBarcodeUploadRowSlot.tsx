"use client";

import { Button } from "@/components/ui/Button";
import SchemaDeleteModal from "@/modules/dashboard/component/SchemaDeleteModal";
import { Archive, FileText, Trash2 } from "lucide-react";
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

export default function BulkBarcodeUploadRowSlot({
  item,
  deleteAction,
}: BulkBarcodeUploadRowSlotProps) {
  const id = String(item.id ?? "");
  const fileName = String(item.fileName ?? "-");
  const totalRows = Number(item.totalRows ?? 0);
  const generatedCount = Number(item.generatedCount ?? 0);
  const failedCount = Number(item.failedCount ?? 0);

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
        <Button type="button" variant="outline" size="sm" asChild>
          <a href={downloadUrl(id, "zip")}>
            <Archive className="h-3.5 w-3.5" />
            ZIP
          </a>
        </Button>
        <Button type="button" variant="outline" size="sm" asChild>
          <a href={downloadUrl(id, "pdf")}>
            <FileText className="h-3.5 w-3.5" />
            PDF
          </a>
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
