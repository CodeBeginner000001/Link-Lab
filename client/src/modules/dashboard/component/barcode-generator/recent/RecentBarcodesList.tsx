import { Loader2 } from "lucide-react";
import RecentBarcodeRow from "./RecentBarcodeRow";
import RecentBarcodesHeader from "./RecentBarcodesHeader";
import RecentBarcodesPagination from "./RecentBarcodesPagination";
import { RecentBarcode } from "./types";

export default function RecentBarcodesList({
  items,
  onDeleted,
  page,
  totalPages,
  total,
  loading,
  onPageChange,
}: {
  items: RecentBarcode[];
  onDeleted: (id: string) => void;
  page: number;
  totalPages: number;
  total: number;
  loading: boolean;
  onPageChange: (page: number) => void;
}) {
  return (
    <div
      className="relative overflow-hidden rounded-2xl border border-[hsl(var(--border))]"
      aria-busy={loading}
    >
      <RecentBarcodesHeader />
      <div
        className={`divide-y divide-[hsl(var(--border))] transition-opacity ${
          loading ? "opacity-55" : "opacity-100"
        }`}
      >
        {items.map((barcode) => (
          <RecentBarcodeRow
            key={barcode.id}
            barcode={barcode}
            onDeleted={onDeleted}
          />
        ))}
      </div>
      {loading ? (
        <div className="pointer-events-none absolute inset-x-0 top-12 bottom-14 flex items-center justify-center bg-[hsl(var(--card)/0.2)]">
          <Loader2 className="h-5 w-5 animate-spin text-[hsl(var(--primary))]" />
        </div>
      ) : null}
      <RecentBarcodesPagination
        page={page}
        totalPages={totalPages}
        total={total}
        loading={loading}
        onPageChange={onPageChange}
      />
    </div>
  );
}
