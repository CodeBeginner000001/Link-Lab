"use client";

import { Button } from "@/components/ui/Button";
import { GetUserBarcodes } from "@/service/dashboard/barcode-generator";
import { BarcodePagination } from "@/service/dashboard/barcode-generator/type";
import { History, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import ToolEmptyState from "../common/ToolEmptyState";
import ToolFeaturePill from "../common/ToolFeaturePill";
import ToolPanel from "../common/ToolPanel";
import RecentBarcodesList from "./recent/RecentBarcodesList";
import { RecentBarcode } from "./recent/types";

const PAGE_LIMIT = 10;
const INITIAL_PAGINATION: BarcodePagination = {
  page: 1,
  limit: PAGE_LIMIT,
  total: 0,
  totalPages: 0,
  hasMore: false,
};

export default function RecentBarcodesPanel() {
  const [items, setItems] = useState<RecentBarcode[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] =
    useState<BarcodePagination>(INITIAL_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;

    const loadBarcodes = async () => {
      setLoading(true);
      setError(null);

      const response = await GetUserBarcodes(page, PAGE_LIMIT);

      if (!active) {
        return;
      }

      if ("error" in response) {
        const message = response.error.message;
        setError(
          Array.isArray(message)
            ? (message[0] ?? "Failed to load barcodes.")
            : (message ?? "Failed to load barcodes."),
        );
        setLoading(false);
        return;
      }

      const data = response.result.data;
      setItems(
        data.items.map((barcode) => ({
          id: barcode.id,
          format: barcode.format,
          content: barcode.content,
          svg: barcode.svg,
          totalDownloads: barcode.totalDownloads,
          downloadCounts: barcode.downloadCounts,
          createdAt: barcode.createdAt,
        })),
      );
      setPagination(data.pagination);
      setLoading(false);
    };

    void loadBarcodes();

    return () => {
      active = false;
    };
  }, [page, reloadKey]);

  const handleDeleted = (id: string) => {
    if (items.length === 1 && page > 1) {
      setPage((currentPage) => currentPage - 1);
      return;
    }

    setItems((currentItems) =>
      currentItems.filter((barcode) => barcode.id !== id),
    );
    setReloadKey((currentKey) => currentKey + 1);
  };

  const isInitialLoading =
    loading && items.length === 0 && pagination.total === 0;

  return (
    <ToolPanel
      heading="Your Barcodes"
      para="All your generated barcodes with export activity."
      headerSlot={
        pagination.total > 0 ? (
          <ToolFeaturePill
            icon={History}
            label={`${pagination.total} barcodes`}
          />
        ) : undefined
      }
    >
      {isInitialLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-5 w-5 animate-spin text-[hsl(var(--muted-foreground))]" />
        </div>
      ) : error && items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">{error}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setReloadKey((currentKey) => currentKey + 1)}
          >
            Try again
          </Button>
        </div>
      ) : items.length === 0 ? (
        <ToolEmptyState
          icon={History}
          title="No barcodes yet"
          description="Generate your first barcode and it will appear here."
        />
      ) : (
        <RecentBarcodesList
          items={items}
          onDeleted={handleDeleted}
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          loading={loading}
          onPageChange={setPage}
        />
      )}
    </ToolPanel>
  );
}
