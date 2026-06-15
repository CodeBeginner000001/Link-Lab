import { Button } from "@/components/ui/Button";
import { ChevronLeft, ChevronRight } from "lucide-react";

type RecentBarcodesPaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  loading: boolean;
  onPageChange: (page: number) => void;
};

export default function RecentBarcodesPagination({
  page,
  totalPages,
  total,
  loading,
  onPageChange,
}: RecentBarcodesPaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 border-t border-[hsl(var(--border))] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-[hsl(var(--muted-foreground))]">
        Page {page} of {totalPages} · {total} barcodes
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={loading || page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={loading || page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
