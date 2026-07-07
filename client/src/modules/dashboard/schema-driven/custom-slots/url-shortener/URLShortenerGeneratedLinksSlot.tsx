import { Button } from "@/components/ui/Button";
import ToolEmptyState from "../../../component/ToolEmptyState";
import { ExternalLink, Link2 } from "lucide-react";
import Link from "next/link";

type URLShortenerGeneratedLinksSlotProps = {
  items: Record<string, unknown>[];
};

const getRedirectPath = (item: Record<string, unknown>) => {
  const alias = String(item.alias ?? "");

  return alias
    ? `/api/r/${encodeURIComponent(alias)}`
    : String(item.shortUrl ?? "#");
};

export default function URLShortenerGeneratedLinksSlot({
  items,
}: URLShortenerGeneratedLinksSlotProps) {
  if (!items.length) {
    return (
      <ToolEmptyState
        icon={Link2}
        title="No generated links yet"
        description="Create a short link and the latest generated links will appear here."
        className="min-h-[220px]"
      />
    );
  }

  return (
    <div className="space-y-3">
      {items.slice(0, 4).map((item, index) => (
        <div
          key={String(item.id ?? index)}
          className="flex items-center gap-3 max-[420px]:flex-col max-[420px]:items-start"
        >
          <p className="min-w-0 flex-1 truncate text-sm font-semibold text-[hsl(var(--primary))]">
            {String(item.shortUrl ?? "-")}
          </p>
          <Button
            variant="outline"
            className="h-8 px-2 py-2 max-[420px]:w-full"
            asChild
          >
            <Link
              href={getRedirectPath(item)}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Open ${String(item.shortUrl ?? "short URL")}`}
            >
              <ExternalLink className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      ))}
    </div>
  );
}
