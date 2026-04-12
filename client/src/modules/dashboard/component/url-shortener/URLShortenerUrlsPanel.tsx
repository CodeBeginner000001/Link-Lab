import { Button } from "@/components/ui/Button";
import { ShortUrlItem } from "@/service/dashboard/url-shortener/type";
import { BarChart3, ExternalLink, Link2 } from "lucide-react";
import Link from "next/link";
import ToolEmptyState from "../common/ToolEmptyState";
import ToolFeaturePill from "../common/ToolFeaturePill";
import ToolPanel from "../common/ToolPanel";

type URLShortenerUrlsPanelProps = {
  items: ShortUrlItem[];
};

export default function URLShortenerUrlsPanel({ items }: URLShortenerUrlsPanelProps) {
  return (
    <ToolPanel
      heading="Your Shortened URLs"
      para={
        items.length
          ? `${items.length} generated link${items.length > 1 ? "s" : ""}.`
          : "Recent short links will appear here after you create them."
      }
      headerSlot={
        items.length ? (
          <ToolFeaturePill icon={BarChart3} label={`${items.length} total`} />
        ) : undefined
      }
    >
      {items.length ? (
        <div className="space-y-3 max-[350px]:space-y-2.5">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 max-[350px]:flex-col max-[350px]:items-start max-[350px]:gap-2"
            >
              <p className="min-w-0 flex-1 truncate text-xs font-semibold text-[hsl(var(--primary))] max-[350px]:w-full max-[350px]:text-[11px] sm:text-sm">
                {item.shortUrl}
              </p>
              <Button
                variant="outline"
                className="h-8 max-[350px]:w-full max-[350px]:justify-center px-2 py-2"
                asChild
              >
                <Link
                  href={item.longUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open ${item.shortUrl}`}
                >
                  <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Link>
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <ToolEmptyState
          icon={Link2}
          title="No shortened URLs yet"
          description="Create your first short link from the form and the generated URLs will appear here."
        />
      )}
    </ToolPanel>
  );
}
