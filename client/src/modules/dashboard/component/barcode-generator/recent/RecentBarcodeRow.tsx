"use client";

import { Button } from "@/components/ui/Button";
import { Download, Trash2 } from "lucide-react";
import ToolFeaturePill from "../../common/ToolFeaturePill";
import BarcodeDeleteModal from "../BarcodeDeleteModal";
import { RecentBarcode } from "./types";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function RecentBarcodeRow({
  barcode,
  onDeleted,
}: {
  barcode: RecentBarcode;
  onDeleted: (id: string) => void;
}) {
  return (
    <article className="grid gap-4 bg-[hsl(var(--card))] p-4 md:grid-cols-[minmax(240px,1.4fr)_120px_170px_110px_80px] md:items-center md:px-5">
      <div className="flex min-w-0 items-center gap-4">
        <div className="hidden h-14 w-24 shrink-0 items-center overflow-hidden rounded-lg border border-slate-200 bg-white px-2 sm:flex">
          <div
            className="w-full"
            dangerouslySetInnerHTML={{ __html: barcode.svg }}
          />
        </div>
        <div className="min-w-0">
          <p className="truncate font-mono text-sm font-semibold">{barcode.content}</p>
          <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))] sm:hidden">
            {barcode.format} · {formatDate(barcode.createdAt)}
          </p>
        </div>
      </div>

      <div className="hidden md:block">
        <ToolFeaturePill label={barcode.format} />
      </div>

      <p className="hidden text-sm text-[hsl(var(--muted-foreground))] md:block">
        {formatDate(barcode.createdAt)}
      </p>

      <div className="flex items-center justify-between gap-3 md:block">
        <span className="text-xs text-[hsl(var(--muted-foreground))] md:hidden">Downloads</span>
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
          <Download className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
          {barcode.totalDownloads}
        </span>
      </div>

      <div className="flex items-center">
        <BarcodeDeleteModal
          barcode={barcode}
          onDeleted={onDeleted}
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
      </div>
    </article>
  );
}
