import ToolEmptyState from "@/modules/dashboard/component/ToolEmptyState";
import ToolFeaturePill from "@/modules/dashboard/component/ToolFeaturePill";
import ToolPanel from "@/modules/dashboard/component/ToolPanel";
import { GetCurrentUser } from "@/service/auth";
import { BACKEND_API_URL } from "@/utils/env";
import {
  Activity,
  BarChart3,
  Barcode,
  Clock,
  ExternalLink,
  Link2,
  LinkIcon,
  RefreshCw,
  ScanBarcode,
  TrendingUp,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";

type DashboardTool = {
  key: string;
  label: string;
  href: string;
  count: number;
  metricLabel: string;
  secondaryValue?: number;
  secondaryLabel?: string;
};

type DashboardSummary = {
  stats: {
    totalItems: number;
    totalActivity: number;
    activeTools: number;
    availableTools: number;
  };
  tools: DashboardTool[];
  recentActivity: RecentActivity[];
};

type ApiSuccessResponse<T> = {
  data: T;
};

type RecentActivity = {
  id: string;
  feature: string;
  label: string;
  description: string;
  href: string;
  createdAt: string | null;
};

type DashboardToolView = {
  key: string;
  label: string;
  href: string;
  icon: LucideIcon;
  count: number;
  iconClassName?: string;
};

const fallbackSummary: DashboardSummary = {
  stats: {
    totalItems: 0,
    totalActivity: 0,
    activeTools: 0,
    availableTools: 6,
  },
  tools: [],
  recentActivity: [],
};

const dashboardTools: DashboardToolView[] = [
  {
    key: "url-shortener",
    label: "URL Shortener",
    href: "/dashboard/url-shortener",
    icon: Link2,
    count: 0,
  },
  {
    key: "link-expander",
    label: "Link Expands",
    href: "/dashboard/link-expander",
    icon: ExternalLink,
    count: 0,
  },
  {
    key: "broken-link-checker",
    label: "Link Checks",
    href: "/dashboard/broken-link-checker",
    icon: LinkIcon,
    count: 0,
  },
  {
    key: "barcode-generator",
    label: "Barcodes",
    href: "/dashboard/barcode-generator",
    icon: Barcode,
    count: 0,
  },
  {
    key: "bulk-barcode-generator",
    label: "Bulk Barcodes",
    href: "/dashboard/bulk-barcode-generator",
    icon: ScanBarcode,
    count: 0,
  },
  {
    key: "one-time-link",
    label: "One-Time Links",
    href: "/dashboard/onetime-link",
    icon: Clock,
    count: 0,
  },
];

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Overview of your Link Lab activity.",
};

async function getDashboardSummary(cookieHeader: string) {
  try {
    const response = await fetch(`${BACKEND_API_URL}/dashboard/summary`, {
      method: "GET",
      headers: {
        Cookie: cookieHeader,
      },
      next: {
        revalidate: 10,
        tags: ["dashboard-summary"],
      },
    });

    if (!response.ok) {
      return fallbackSummary;
    }

    const json = (await response.json()) as ApiSuccessResponse<DashboardSummary>;

    return json.data ?? fallbackSummary;
  } catch {
    return fallbackSummary;
  }
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en").format(value);
}

function getUserDisplayName(name?: string | null, email?: string | null) {
  if (name?.trim()) {
    return name.trim().split(/\s+/)[0];
  }

  if (email?.trim()) {
    return email.split("@")[0];
  }

  return "there";
}

function mergeToolCounts(summaryTools: DashboardTool[]) {
  const countByKey = new Map(
    summaryTools.map((tool) => [tool.key, tool.count] as const),
  );

  return dashboardTools.map((tool) => ({
    ...tool,
    count: countByKey.get(tool.key) ?? tool.count,
  }));
}

function formatDate(value: string | null) {
  if (!value) {
    return "Recently";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.toString();
  const accessToken = cookieStore.get("access_token")?.value;
  const [summary, user] = await Promise.all([
    getDashboardSummary(cookieHeader),
    accessToken ? GetCurrentUser(accessToken) : Promise.resolve(null),
  ]);
  const tools = mergeToolCounts(summary.tools);
  const clickRate =
    summary.stats.totalItems > 0
      ? Math.min(
          100,
          Math.round((summary.stats.totalActivity / summary.stats.totalItems) * 10),
        )
      : 0;
  const stats = [
    {
      label: "Total Created",
      value: formatNumber(summary.stats.totalItems),
      icon: Link2,
    },
    {
      label: "Tracked Activity",
      value: formatNumber(summary.stats.totalActivity),
      icon: Activity,
    },
    {
      label: "Active Tools",
      value: `${summary.stats.activeTools}/${summary.stats.availableTools}`,
      icon: BarChart3,
    },
    {
      label: "Activity Rate",
      value: `${clickRate}%`,
      icon: TrendingUp,
    },
  ];

  return (
    <div className="space-y-7 pb-8">
      <section className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          Welcome back,{" "}
          <span className="gradient-text">
            {getUserDisplayName(user?.name, user?.email)}!
          </span>
        </h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Here&apos;s an overview of your LinkLab activity
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight">Quick Analytics</h2>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div key={stat.label} className="glass-card p-4">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-[hsl(var(--primary))]">
                    <Icon className="h-4 w-4" />
                  </span>
                </div>
                <p className="text-2xl font-bold leading-none text-foreground">
                  {stat.value}
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  {stat.label}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-bold tracking-tight">Quick Action</h2>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {tools.map((tool) => {
            const Icon = tool.icon;

            return (
              <Link
                key={`quick-${tool.key}`}
                href={tool.href}
                className="glass-card-hover group flex min-h-28 flex-col items-center justify-center gap-3 p-4 text-center"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-[hsl(var(--primary))] transition-colors group-hover:bg-primary/20">
                  <Icon className={`h-5 w-5 ${tool.iconClassName ?? ""}`} />
                </span>
                <span className="text-xs font-semibold leading-4 text-foreground sm:text-sm">
                  {tool.label}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold tracking-tight">Tools</h2>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 ">
          {tools.map((tool) => {
            const Icon = tool.icon;

            return (
              <Link
                key={tool.key}
                href={tool.href}
                className="glass-card-hover group min-h-28 p-3.5"
              >
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-[hsl(var(--primary))] transition-colors group-hover:bg-primary/20">
                    <Icon className={`h-4 w-4 ${tool.iconClassName ?? ""}`} />
                  </span>
                  <span className="text-2xl font-bold leading-none text-foreground">
                    {formatNumber(tool.count)}
                  </span>
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {tool.label}
                </p>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Total generated
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <ToolPanel
        heading="Analytics Overview"
        para="Recent tool usage with creation details appears here."
      >
        <div className="mb-6 flex flex-wrap gap-3">
          <ToolFeaturePill icon={BarChart3} label="Recent tool usage" />
          <ToolFeaturePill icon={RefreshCw} label="Auto-Refresh in 10 second" />
        </div>

        {summary.recentActivity.length > 0 ? (
          <div className="overflow-hidden rounded-xl border border-[hsl(var(--border))]">
            <div className="hidden grid-cols-[minmax(140px,0.8fr)_minmax(0,1.6fr)_minmax(120px,0.6fr)] gap-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.32)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))] md:grid">
              <span>Tool Used</span>
              <span>Activity</span>
              <span className="text-right">Created</span>
            </div>

            <div className="divide-y divide-[hsl(var(--border))]">
              {summary.recentActivity.map((activity) => (
                <Link
                  key={`${activity.feature}-${activity.id}`}
                  href={activity.href}
                  className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-2 px-3 py-3 text-sm transition-colors hover:bg-[hsl(var(--secondary)/0.2)] sm:px-4 md:grid-cols-[minmax(140px,0.8fr)_minmax(0,1.6fr)_minmax(120px,0.6fr)] md:items-center md:gap-3"
                >
                  <div className="min-w-0 md:order-1">
                    <p className="text-[12px] font-bold uppercase text-muted-foreground md:hidden">
                      Tool Used
                    </p>
                    <p className="truncate text-[10px] md:text-sm font-semibold text-foreground md:mt-0">
                      {activity.feature}
                    </p>
                  </div>

                  <div className="min-w-0 text-right md:order-3 md:text-right">
                    <p className="text-[12px] font-bold uppercase text-muted-foreground md:hidden">
                      Created
                    </p>
                    <p className="text-xs font-medium text-foreground md:mt-0">
                      {formatDate(activity.createdAt)}
                    </p>
                  </div>

                  <div className="col-span-2 min-w-0 md:order-2 md:col-span-1">
                    <p className="text-[12px] font-bold uppercase text-muted-foreground md:hidden">
                      Activity
                    </p>
                    <p className="truncate text-[10px] md:text-sm font-medium text-foreground md:mt-0">
                      {activity.label}
                    </p>
                    <p className="mt-1 line-clamp-1 break-all text-xs text-muted-foreground">
                      {activity.description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <ToolEmptyState
            icon={BarChart3}
            title="No dashboard analytics yet"
            description="Create your first link, barcode, or check result and the activity will appear here."
          />
        )}
      </ToolPanel>
    </div>
  );
}
