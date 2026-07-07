import {
  BarChart3,
  Barcode,
  Download,
  Palette,
} from "lucide-react";

import type { SchemaAnalyticsPanel } from "../types";

export const barcodeGeneratorAnalyticsPanel: SchemaAnalyticsPanel = {
  title: "Barcode Analytics",
  description:
    "Review generation totals, download usage, and weekly barcode activity.",
  chips: [{ icon: BarChart3, label: "Weekly activity" }],
  api: {
    path: "/barcodes/analytics",
    method: "GET",
    responsePath: "data",
    cacheTags: ["barcodes"],
  },
  cards: [
    { icon: Barcode, label: "Generated", valuePath: "generated" },
    { icon: Download, label: "Downloads", valuePath: "downloads" },
    { icon: Palette, label: "Formats", valuePath: "format" },
  ],
  activityTitle: "Weekly activity",
  sections: [
    {
      type: "activity",
      api: {
        path: "/barcodes/analytics/activity/:period/:date",
        method: "GET",
        responsePath: "data",
        useProxy: true,
        cacheTags: ["barcodes"],
      },
      defaultPeriod: "week",
      titleByPeriod: {
        week: "Weekly activity",
        month: "Monthly activity",
        year: "Yearly activity",
      },
      descriptionTemplate: "Barcodes generated in the selected {period}",
      refreshEvent: "barcode-data-changed",
    },
    {
      type: "distribution",
      api: {
        path: "/barcodes/analytics/format-mix",
        method: "GET",
        responsePath: "data",
        cacheTags: ["barcodes"],
      },
      title: "Format mix",
      description: "Share of generated barcodes",
      valuePath: "formatDistribution",
      emptyText: "Generate a barcode to see format distribution.",
      secondary: {
        title: "Download formats",
        totalLabel: "Total",
        segments: [
          {
            label: "SVG",
            valuePath: "downloadFormatDistribution.svg",
            className: "bg-[hsl(var(--primary))]",
          },
          {
            label: "PNG",
            valuePath: "downloadFormatDistribution.png",
            className: "bg-indigo-500",
          },
        ],
      },
    },
  ],
};
