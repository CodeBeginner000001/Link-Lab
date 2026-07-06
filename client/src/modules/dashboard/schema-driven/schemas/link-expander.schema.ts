import {
  BarChart3,
  ExternalLink,
  Link2,
  MousePointerClick,
  RefreshCw,
  SearchCheck,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import type { FeatureToolSchema } from "../types";

export type LinkExpanderFormValues = {
  url: string;
};

export type LinkExpanderListItem = {
  id: string;
  url: string;
  destinationUrl: string;
  redirectCount: number;
  status: string;
  createdAt: string;
};

export type LinkExpanderAnalytics = {
  totals: {
    expanded: number;
    redirects: number;
    failed: number;
  };
};

export const toolSchema: FeatureToolSchema<
  LinkExpanderFormValues,
  LinkExpanderListItem,
  LinkExpanderAnalytics
> = {
  slug: "link-expander",
  route: "/dashboard/link-expander",
  header: {
    icon: SearchCheck,
    title: "Link Expander",
    description:
      "Expand short links, reveal their final destination, and review recent lookup history.",
    canonical: "/dashboard/link-expander",
  },
  panels: {
    form: {
      title: "Expand a Link",
      description:
        "Enter a short or redirected URL to find its final destination.",
      responsiveChip: {
        icon: Sparkles,
        label: "Responsive form",
      },
      chips: [
        { icon: Link2, label: "Short link lookup" },
        { icon: ExternalLink, label: "Destination preview" },
        { icon: ShieldCheck, label: "Safe before opening" },
      ],
      api: {
        path: "/link-expanders",
        method: "POST",
        cacheTags: ["link-expanders"],
      },
      successEvent: "link-expander-data-changed",
      fields: [
        {
          name: "url",
          label: "URL",
          type: "url",
          required: true,
          placeholder: "https://short.ly/example",
          description:
            "Paste any short or redirected URL to reveal the final destination.",
          submit: {
            trim: true,
            prefixUrlProtocol: true,
          },
          layout: { row: 1, colSpan: 2 },
        },
      ],
      submit: {
        icon: SearchCheck,
        label: "Expand Link",
        loadingLabel: "Expanding...",
      },
    },

    secondary: {
      title: "Expanded Destination",
      description:
        "View the final destination URL before opening the link.",
      chips: [{ icon: ExternalLink, label: "Final destination" }],
      slot: "link-expander.result",
    },

    analytics: {
      title: "Link Expander Analytics",
      description:
        "Track expanded links, redirects followed, and failed expansion attempts.",
      chips: [{ icon: BarChart3, label: "Lookup overview" }],
      api: {
        path: "/link-expanders/analytics",
        method: "GET",
        responsePath: "data",
        cacheTags: ["link-expanders"],
      },
      cards: [
        { icon: Link2, label: "Expanded", valuePath: "total" },
        {
          icon: MousePointerClick,
          label: "Redirects",
          valuePath: "redirects",
        },
        {
          icon: ShieldCheck,
          label: "Failed",
          valuePath: "failed",
        },
      ],
    },

    data: {
      title: "Recent Expanded Links",
      description:
        "Review recently expanded URLs and their final destinations.",
      chips: [
        { icon: Link2, label: "Saved lookups" },
        { icon: RefreshCw, label: "Auto-Refresh in 10 seconds" },
      ],
      api: {
        path: "/link-expanders",
        method: "GET",
        responsePath: "data",
        cacheTags: ["link-expanders"],
      },
      deleteAction: {
        api: {
          path: "/link-expanders/:id",
          method: "DELETE",
          cacheTags: ["link-expanders"],
        },
        subjectValuePath: "url",
        eyebrow: "Delete Lookup",
        title: "Confirm removal",
        subjectLabel: "You are about to delete:",
        confirmKeyword: "confirm",
        confirmLabel: "Delete Lookup",
        loadingLabel: "Deleting...",
        successMessage: "Expanded link deleted.",
        errorMessage: "Failed to delete expanded link.",
        successEvent: "link-expander-data-changed",
      },
      pagination: {
        enabled: true,
        pageSize: 10,
        itemsPath: "items",
        paginationPath: "pagination",
        itemLabel: "links",
      },
      columns: [
        { key: "url", label: "URL" },
        { key: "redirectCount", label: "Redirects" },
        { key: "status", label: "Status" },
        { key: "createdAt", label: "Created" },
      ],
      rowSlot: "link-expander.row",
      emptyState: {
        icon: SearchCheck,
        title: "No expanded links yet",
        description:
          "Expand your first link from the form and recent lookups will appear here.",
      },
    },
  },

  mapAnalytics: (response) => {
    const data = response as {
      total?: number;
      redirects?: number;
      failed?: number;
    };

    return {
      totals: {
        expanded: data.total ?? 0,
        redirects: data.redirects ?? 0,
        failed: data.failed ?? 0,
      },
      total: data.total ?? 0,
      redirects: data.redirects ?? 0,
      failed: data.failed ?? 0,
    };
  },
};
