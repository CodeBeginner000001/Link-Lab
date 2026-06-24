import {
  BarChart3,
  ExternalLink,
  Link2,
  MousePointerClick,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import type { FeatureToolSchema } from "../types";

export type UrlShortenerFormValues = {
  longUrl: string;
  customAlias?: string;
};

export type UrlShortenerListItem = {
  id: string;
  shortUrl: string;
  longUrl: string;
  clicks: number;
  createdAt: string;
};

export type UrlShortenerAnalytics = {
  totals: {
    links: number;
    clicks: number;
    activeLinks: number;
  };
};

export const toolSchema: FeatureToolSchema<
  UrlShortenerFormValues,
  UrlShortenerListItem,
  UrlShortenerAnalytics
> = {
  slug: "url-shortener",
  route: "/dashboard/url-shortener",
  header: {
    icon: Link2,
    title: "URL Shortener",
    description: "Create short, memorable links that redirect to any URL.",
    canonical: "/dashboard/url-shortener",
  },
  panels: {
    form: {
      title: "Shorten a URL",
      description:
        "Enter a long destination, choose an optional alias, and create a share-ready short link.",
      responsiveChip: {
        icon: Sparkles,
        label: "Responsive form",
      },
      chips: [
        { icon: Link2, label: "Shareable links" },
        { icon: BarChart3, label: "Click tracking ready" },
        { icon: Sparkles, label: "Custom aliases" },
      ],
      api: {
        path: "/short-urls",
        method: "POST",
        cacheTags: ["short-urls"],
      },
      fields: [
        {
          name: "longUrl",
          label: "Long URL",
          type: "url",
          required: true,
          placeholder: "https://example.com/very-long-url",
          description: "The destination users should reach after opening the short link.",
          submit: { trim: true, prefixUrlProtocol: true },
          layout: { row: 1, colSpan: 2 },
        },
        {
          name: "customAlias",
          label: "Custom Alias",
          type: "text",
          placeholder: "my-custom-link",
          description:
            "Letters, numbers, and hyphens only. Leave it blank to auto-generate one.",
          submit: { trim: true, omitWhenEmpty: true },
          layout: { row: 2, colSpan: 2 },
          validation: {
            pattern: "^[a-zA-Z0-9-]*$",
            message: "Use letters, numbers, and hyphens only.",
          },
        },
      ],
      submit: {
        icon: Link2,
        label: "Shorten URL",
        loadingLabel: "Shortening...",
      },
    },
    secondary: {
      title: "Generated Links",
      description:
        "Feature-specific slot. URL Shortener can render recent links with an external-open action here.",
      chips: [{ icon: ExternalLink, label: "Open destination" }],
      slot: "url-shortener.generated-links",
    },
    analytics: {
      title: "Link Analytics",
      description:
        "Track short-link totals and weekly click activity from the analytics API.",
      chips: [{ icon: MousePointerClick, label: "Weekly activity" }],
      api: {
        path: "/short-urls/analytics",
        method: "GET",
        responsePath: "data",
        cacheTags: ["short-urls"],
      },
      cards: [
        { icon: Link2, label: "Total links", valuePath: "total" },
        {
          icon: MousePointerClick,
          label: "Total clicks",
          valuePath: "totalClicks",
        },
        {
          icon: BarChart3,
          label: "Top alias",
          valuePath: "topAlias",
        },
      ],
      activityTitle: "Weekly activity",
    },
    data: {
      title: "Your Shortened URLs",
      description: "Review generated short links and their destination URLs.",
      chips: [{ icon: Link2, label: "Saved links" }, {icon: RefreshCw, label: "Auto-Refresh in 10 second"}],
      api: {
        path: "/short-urls",
        method: "GET",
        responsePath: "data",
        cacheTags: ["short-urls"],
      },
      deleteAction: {
        api: {
          path: "/short-urls/:id",
          method: "DELETE",
          cacheTags: ["short-urls"],
        },
        subjectValuePath: "shortUrl",
        eyebrow: "Delete Link",
        title: "Confirm removal",
        subjectLabel: "You are about to delete:",
        confirmKeyword: "confirm",
        confirmLabel: "Delete Link",
        loadingLabel: "Deleting...",
        successMessage: "Short URL deleted.",
        errorMessage: "Failed to delete short URL.",
      },
      pagination: {
        enabled: true,
        pageSize: 10,
        itemsPath: "items",
        paginationPath: "pagination",
        itemLabel: "links",
      },
      columns: [
        { key: "shortUrl", label: "Short URL" },
        { key: "longUrl", label: "Destination" },
        { key: "clicks", label: "Clicks" },
        { key: "createdAt", label: "Created" },
      ],
      rowSlot: "url-shortener.row",
      emptyState: {
        icon: Link2,
        title: "No shortened URLs yet",
        description:
          "Create your first short link from the form and the generated URLs will appear here.",
      },
    },
  },
  mapAnalytics: (response) => {
    const data = response as {
      total?: number;
      totalClicks?: number;
      topAlias?: string | null;
    };

    return {
      totals: {
        links: data.total ?? 0,
        clicks: data.totalClicks ?? 0,
        activeLinks: data.total ?? 0,
      },
      total: data.total ?? 0,
      totalClicks: data.totalClicks ?? 0,
      activeLinks: data.total ?? 0,
      topAlias: data.topAlias ?? "-",
    };
  },
};
