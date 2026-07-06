import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  ExternalLink,
  Link2,
  RefreshCw,
  SearchCheck,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { FeatureToolSchema } from "../types";

export type BrokenLinkCheckerFormValues = {
  url: string;
};

export type BrokenLinkCheckerListItem = {
  id: string;
  url: string;
  finalUrl?: string;
  statusCode?: number;
  status: string;
  isBroken: boolean;
  isUnsafe?: boolean;
  safetyStatus?: string;
  safetyProvider?: string | null;
  threatTypes?: string[];
  contentType?: string | null;
  contentLength?: number | null;
  contentDisposition?: string | null;
  errorMessage?: string;
  createdAt: string;
};

export type BrokenLinkCheckerAnalytics = {
  totals: {
    checked: number;
    broken: number;
    working: number;
    unsafe: number;
  };
};

export const toolSchema: FeatureToolSchema<
  BrokenLinkCheckerFormValues,
  BrokenLinkCheckerListItem,
  BrokenLinkCheckerAnalytics
> = {
  slug: "broken-link-checker",
  route: "/dashboard/broken-link-checker",
  header: {
    icon: AlertTriangle,
    title: "Broken Link Checker",
    description:
      "Check whether a link is working, broken, redirected, unreachable, or flagged as unsafe.",
    canonical: "/dashboard/broken-link-checker",
  },
  panels: {
    form: {
      title: "Check a Link",
      description:
        "Enter a URL to verify reachability and screen it for known malware or phishing threats.",
      responsiveChip: {
        icon: Sparkles,
        label: "Responsive form",
      },
      chips: [
        { icon: Link2, label: "URL health check" },
        { icon: ShieldCheck, label: "Threat screening" },
        { icon: ExternalLink, label: "Redirect preview" },
      ],
      api: {
        path: "/broken-link-checkers",
        method: "POST",
        cacheTags: ["broken-link-checkers"],
      },
      successEvent: "broken-link-checker-data-changed",
      fields: [
        {
          name: "url",
          label: "URL",
          type: "url",
          required: true,
          placeholder: "https://example.com/page",
          description:
            "Paste any URL to check whether it is reachable and whether it is listed as a known threat.",
          submit: {
            trim: true,
            prefixUrlProtocol: true,
          },
          layout: { row: 1, colSpan: 2 },
        },
      ],
      submit: {
        icon: SearchCheck,
        label: "Check Link",
        loadingLabel: "Checking...",
      },
    },

    secondary: {
      title: "Link Check Result",
      description:
        "View the URL status, response code, safety status, and final destination.",
      chips: [{ icon: CheckCircle2, label: "Status result" }],
      slot: "broken-link-checker.result",
    },

    analytics: {
      title: "Broken Link Analytics",
      description:
        "Track checked links, working links, broken links, and unsafe results.",
      chips: [{ icon: BarChart3, label: "Health overview" }],
      api: {
        path: "/broken-link-checkers/analytics",
        method: "GET",
        responsePath: "data",
        cacheTags: ["broken-link-checkers"],
      },
      cards: [
        {
          icon: Link2,
          label: "Checked",
          valuePath: "checked",
        },
        {
          icon: CheckCircle2,
          label: "Working",
          valuePath: "working",
        },
        {
          icon: AlertTriangle,
          label: "Broken",
          valuePath: "broken",
        },
        {
          icon: ShieldCheck,
          label: "Unsafe",
          valuePath: "unsafe",
        },
      ],
    },

    data: {
      title: "Recent Link Checks",
      description:
        "Review recently checked URLs and their latest health status.",
      chips: [
        { icon: Link2, label: "Saved checks" },
        { icon: RefreshCw, label: "Auto-Refresh in 10 seconds" },
      ],
      api: {
        path: "/broken-link-checkers",
        method: "GET",
        responsePath: "data",
        cacheTags: ["broken-link-checkers"],
      },
      deleteAction: {
        api: {
          path: "/broken-link-checkers/:id",
          method: "DELETE",
          cacheTags: ["broken-link-checkers"],
        },
        subjectValuePath: "url",
        eyebrow: "Delete Link Check",
        title: "Confirm removal",
        subjectLabel: "You are about to delete:",
        confirmKeyword: "confirm",
        confirmLabel: "Delete Check",
        loadingLabel: "Deleting...",
        successMessage: "Link check deleted.",
        errorMessage: "Failed to delete link check.",
        successEvent: "broken-link-checker-data-changed",
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
        { key: "statusCode", label: "Status Code" },
        { key: "status", label: "Status" },
        { key: "safetyStatus", label: "Safety" },
        { key: "createdAt", label: "Created" },
      ],
      rowSlot: "broken-link-checker.row",
      emptyState: {
        icon: AlertTriangle,
        title: "No links checked yet",
        description:
          "Check your first URL from the form and recent results will appear here.",
      },
    },
  },

  mapAnalytics: (response) => {
    const data = response as {
      checked?: number;
      working?: number;
      broken?: number;
      unsafe?: number;
    };

    return {
      totals: {
        checked: data.checked ?? 0,
        working: data.working ?? 0,
        broken: data.broken ?? 0,
        unsafe: data.unsafe ?? 0,
      },
      checked: data.checked ?? 0,
      working: data.working ?? 0,
      broken: data.broken ?? 0,
      unsafe: data.unsafe ?? 0,
    };
  },
};
