"use client";

import { Button } from "@/components/ui/Button";
import {
  GetBarcodeDownloadFilename,
  GetBarcodeDownloadUrl,
} from "@/service/dashboard/barcode-generator";
import { Download, FileImage, Trash2 } from "lucide-react";
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
  const pngDownloadUrl = GetBarcodeDownloadUrl(barcode.id, "png");
  const svgDownloadUrl = GetBarcodeDownloadUrl(barcode.id, "svg");
  const pngFilename = GetBarcodeDownloadFilename(barcode, "png");
  const svgFilename = GetBarcodeDownloadFilename(barcode, "svg");

  return (
    <article className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 bg-[hsl(var(--card))] p-4 lg:grid-cols-[minmax(220px,1.4fr)_110px_150px_100px_150px_52px] lg:items-center lg:gap-4 lg:px-5">
      <div className="flex min-w-0 items-center gap-4">
        <div className="hidden h-12 w-20 shrink-0 items-center overflow-hidden rounded-lg border border-slate-200 bg-white px-2 min-[400px]:flex sm:h-14 sm:w-24">
          <div
            className="w-full"
            dangerouslySetInnerHTML={{ __html: barcode.svg }}
          />
        </div>
        <div className="min-w-0">
          <p className="truncate font-mono text-sm font-semibold">{barcode.content}</p>
          <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))] lg:hidden">
            {barcode.format} · {formatDate(barcode.createdAt)}
          </p>
        </div>
      </div>

      <div className="hidden lg:block">
        <ToolFeaturePill label={barcode.format} />
      </div>

      <p className="hidden text-sm text-[hsl(var(--muted-foreground))] lg:block">
        {formatDate(barcode.createdAt)}
      </p>

      <div className="flex items-center justify-end gap-3 lg:block">
        <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
          <Download className="h-3.5 w-3.5 text-[hsl(var(--muted-foreground))]" />
          {barcode.totalDownloads}
        </span>
      </div>

      <div className="col-span-1 flex min-w-0 items-center justify-start gap-2 lg:col-auto">
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 px-2.5"
            asChild
          >
            <a href={pngDownloadUrl} download={pngFilename}>
              <Download className="h-3.5 w-3.5" />
              PNG
            </a>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 px-2.5"
            asChild
          >
            <a href={svgDownloadUrl} download={svgFilename}>
              <FileImage className="h-3.5 w-3.5" />
              SVG
            </a>
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-end lg:justify-start">
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
