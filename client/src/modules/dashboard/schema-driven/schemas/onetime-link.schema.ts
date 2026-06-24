import {
  BarChart3,
  Clock,
  KeyRound,
  Link2,
  LockKeyhole,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { FeatureToolSchema } from "../types";

export type OneTimeLinkFormValues = {
  originalUrl: string;
  password?: string;
  passwordProtect?: boolean;
};

export type OneTimeLinkListItem = {
  id: string;
  alias: string;
  originalUrl: string;
  oneTimeUrl: string;
  status: string;
  usedAt: string | null;
  createdAt: string;
  passwordProtected: boolean;
};

export type OneTimeLinkAnalytics = {
  totals: {
    generated: number;
    protected: number;
    used: number;
    notUsed: number;
  };
};
export const toolSchema: FeatureToolSchema<
  OneTimeLinkFormValues,
  OneTimeLinkListItem,
  OneTimeLinkAnalytics
> = {
  slug: "onetime-link",
  route: "/dashboard/onetime-link",
  header: {
    icon: ShieldCheck,
    title: "One-Time Link Generator",
    description:
      "Create a link that expires after single use and can be a password protected before access.",
    canonical: "/dashboard/onetime-link",
  },
  panels: {
    form: {
      title: "Create One-Time Link",
      description:
        "The link will automatically expire after being accessed once or can make it password protected",
      responsiveChip: {
        icon: Sparkles,
        label: "Responsive form",
      },
      chips: [
        { icon: Link2, label: "Single-use links" },
        { icon: LockKeyhole, label: "Password protection" },
        { icon: ShieldCheck, label: "Sensitive sharing" },
      ],
      api: {
        path: "/one-time-links",
        method: "POST",
        cacheTags: ["one-time-links"],
      },
      successEvent: "onetime-link-created",
      fields: [
        {
          name: "originalUrl",
          label: "URL",
          type: "url",
          required: true,
          placeholder: "https://example.com/private-resource",
          description:
            "The destination URL that should expire after one visit.",
          submit: { trim: true, prefixUrlProtocol: true },
          layout: { row: 1, colSpan: 2 },
        },
        {
          name: "password",
          label: "Password",
          type: "password",
          required: true,
          placeholder: "Enter an access password",
          description:
            "Visitors will need this password before the link opens.",
          visibleWhen: {
            field: "passwordProtect",
            equals: true,
          },
          submit: { trim: true, omitWhenHidden: true },
          layout: { row: 2, colSpan: 2 },
        },
        {
          name: "passwordProtect",
          label: "Password protect this link",
          type: "checkbox",
          defaultValue: false,
          description:
            "Require a password before the one-time link can be used.",
          layout: { row: 3, colSpan: 2 },
        },
      ],
      submit: {
        icon: KeyRound,
        label: "Generate One-Time Link",
        loadingLabel: "Generating......",
      },
    },
    secondary: {
      title: "Generated One-Time Link",
      description:
        "Create a single-use URL and share it with the intended recipient.",
      chips: [{ icon: KeyRound, label: "One access only" }],
      slot: "onetime-link.generated-link",
    },
    analytics: {
      title: "One-Time Link Analytics",
      description:
        "Review generated links, protected links, and single-use activity.",
      chips: [{ icon: BarChart3, label: "Usage overview" }],
      api: {
        path: "/one-time-links/analytics",
        method: "GET",
        responsePath: "data",
        cacheTags: ["one-time-links"],
      },
      cards: [
        { icon: Link2, label: "Generated", valuePath: "total" },
        { icon: LockKeyhole, label: "Protected", valuePath: "protected" },
        { icon: Clock, label: "Used", valuePath: "used" },
      ],
    },
    data: {
      title: "Your One-Time Links",
      description: "Review created one-time links and their access status.",
      chips: [{ icon: ShieldCheck, label: "Sensitive sharing" }, {icon: RefreshCw, label: "Auto-Refresh in 10 second"}],
      api: {
        path: "/one-time-links",
        method: "GET",
        responsePath: "data",
        cacheTags: ["one-time-links"],
      },
      deleteAction: {
        api: {
          path: "/one-time-links/:id",
          method: "DELETE",
          cacheTags: ["one-time-links"],
        },
        subjectValuePath: "oneTimeUrl",
        eyebrow: "Delete Link",
        title: "Confirm removal",
        subjectLabel: "You are about to delete:",
        confirmKeyword: "confirm",
        confirmLabel: "Delete Link",
        loadingLabel: "Deleting...",
        successMessage: "One-time link deleted.",
        errorMessage: "Failed to delete one-time link.",
      },
      pagination: {
        enabled: true,
        pageSize: 10,
        itemsPath: "items",
        paginationPath: "pagination",
        itemLabel: "links",
      },
      columns: [
        { key: "oneTimeUrl", label: "One-Time URL" },
        { key: "originalUrl", label: "Destination" },
        { key: "passwordProtected", label: "Protected" },
        { key: "status", label: "Status" },
        { key: "usedAt", label: "Used" },
        { key: "createdAt", label: "Created" },
      ],
      emptyState: {
        icon: ShieldCheck,
        title: "No one-time links yet",
        description:
          "Generate your first one-time link from the form and it will appear here.",
      },
    },
  },
  mapAnalytics: (response) => {
    const data = response as {
      total?: number;
      protected?: number;
      used?: number;
      notUsed?: number;
    };

    return {
      totals: {
        generated: data.total ?? 0,
        protected: data.protected ?? 0,
        used: data.used ?? 0,
        notUsed: data.notUsed ?? 0,
      },
      total: data.total ?? 0,
      protected: data.protected ?? 0,
      used: data.used ?? 0,
      notUsed: data.notUsed ?? 0,
    };
  },
};
