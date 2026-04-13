import { GetUserShortUrls } from "@/service/dashboard/url-shortener";
import { ShortUrlItem } from "@/service/dashboard/url-shortener/type";
import { BarChart3, Link2, Sparkles } from "lucide-react";
import { cookies } from "next/headers";

import URLShortenerAnalyticsPanel from "../component/url-shortener/URLShortenerAnalyticsPanel";
import URLShortenerForm from "../component/url-shortener/URLShortenerForm";
import URLShortenerUrlsPanel from "../component/url-shortener/URLShortenerUrlsPanel";
import ToolFeaturePill from "../component/common/ToolFeaturePill";
import ToolPageShell from "../component/common/ToolPageShell";
import ToolPanel from "../component/common/ToolPanel";
import ToolPillGroup from "../component/common/ToolPillGroup";

const URLShortener = async () => {
  const cookieStore = await cookies();
  const res = await GetUserShortUrls({ Cookie: cookieStore.toString() });
  const items: ShortUrlItem[] = "result" in res ? (res.result?.data.items ?? []) : [];

  return (
    <ToolPageShell
      icon={Link2}
      heading="URL Shortener"
      para="Create short, memorable links that redirect to any URL."
      headingClassName="text-xl max-[350px]:text-lg sm:text-2xl"
      iconClassName="h-6 w-6 shrink-0 text-[hsl(var(--primary))] max-[350px]:h-5 max-[350px]:w-5"
      paraClassName="text-sm max-[350px]:text-xs max-[350px]:leading-5 sm:text-base"
    >
      <div className="grid gap-6 max-[350px]:gap-4 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <ToolPanel
          heading="Shorten a URL"
          para="Enter a long destination, choose an optional alias, and create a share-ready short link."
          headerSlot={<ToolFeaturePill icon={Sparkles} label="Responsive form" />}
        >
          <ToolPillGroup className="mb-5">
            <ToolFeaturePill icon={Link2} label="Shareable links" />
            <ToolFeaturePill icon={BarChart3} label="Click tracking ready" />
            <ToolFeaturePill icon={Sparkles} label="Custom aliases" />
          </ToolPillGroup>
          <URLShortenerForm />
        </ToolPanel>

        <URLShortenerUrlsPanel items={items}/>
      </div>

      <URLShortenerAnalyticsPanel items={items} />
    </ToolPageShell>
  );
};

export default URLShortener;
