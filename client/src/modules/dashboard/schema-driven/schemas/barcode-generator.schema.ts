import { GetBarcodeFormats } from "@/service/dashboard/barcode-generator";
import type { BarcodeFormatOption } from "@/service/dashboard/barcode-generator/type";
import {
  BarChart3,
  Barcode,
  Download,
  Eye,
  Palette,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import type { FeatureToolSchema } from "../types";

export type BarcodeGeneratorFormValues = {
  format: string;
  content: string;
  barWidth: number;
  height: number;
  margin: number;
  barColor: string;
  backgroundColor: string;
  showValue: boolean;
};

export type BarcodeListItem = {
  id: string;
  format: string;
  content: string;
  createdAt: string;
  downloadCount?: number;
};

export type BarcodeAnalytics = {
  totals: {
    generated: number;
    downloads: number;
    formats: number;
  };
};

export function createBarcodeGeneratorToolSchema(
  formats: BarcodeFormatOption[],
): FeatureToolSchema<
  BarcodeGeneratorFormValues,
  BarcodeListItem,
  BarcodeAnalytics
> {
  const contentRulesByFormat = Object.fromEntries(
    formats.map((format) => [
      format.value,
      {
        placeholder: format.input.placeholder,
        inputMode: format.input.inputMode,
        uppercase: format.input.uppercase,
        description: [
          `${format.label}: ${format.contentRule}.`,
          ...(format.rules ?? []),
        ].join(" "),
        validation: {
          pattern: format.input.pattern,
          minLength: format.input.minLength,
          maxLength: format.input.maxLength,
        },
      },
    ]),
  );

  return {
    slug: "barcode-generator",
    route: "/dashboard/barcode-generator",
    header: {
      icon: Barcode,
      title: "Barcode Generator",
      description: "Design barcodes, preview the result, and review usage analytics.",
      canonical: '/dashboard/barcode-generator',
    },
    panels: {
      form: {
        title: "Create Barcode",
        description:
          "Set the format, encoded value, and visual output for your barcode.",
        responsiveChip: {
          icon: Sparkles,
          label: "Responsive form",
        },
        chips: [
          { icon: Barcode, label: `${formats.length} barcode formats` },
          { icon: Download, label: "PNG and SVG export" },
          { icon: Palette, label: "Custom appearance" },
        ],
        api: {
          path: "/barcodes",
          method: "POST",
          cacheTags: ["barcodes"],
        },
        successEvent: "barcode-data-changed",
        fields: [
          {
            name: "format",
            label: "Barcode Format",
            type: "select",
            required: true,
            defaultValue: formats[0]?.value,
            layout: { row: 1, colSpan: 2 },
            options: formats.map((format) => ({
              label: format.label,
              value: format.value,
              description: format.description,
            })),
          },
          {
            name: "content",
            label: "Content",
            type: "text",
            required: true,
            placeholder: "Enter barcode value",
            description:
              "Choose a barcode format to see its content rules.",
            dynamicByField: {
              field: "format",
              values: contentRulesByFormat,
            },
            layout: { row: 2, colSpan: 2 },
          },
          {
            name: "barWidth",
            label: "Bar Width",
            type: "number",
            defaultValue: 2,
            layout: { row: 3, colSpan: 1 },
            validation: { min: 1, max: 6, step: 1 },
          },
          {
            name: "height",
            label: "Height",
            type: "number",
            defaultValue: 120,
            layout: { row: 3, colSpan: 1 },
            validation: { min: 40, max: 240, step: 10 },
          },
          {
            name: "margin",
            label: "Margin",
            type: "number",
            defaultValue: 10,
            layout: { row: 4, colSpan: 2 },
            validation: { min: 0, max: 40, step: 1 },
          },
          {
            name: "barColor",
            label: "Bar Color",
            type: "color",
            defaultValue: "#111827",
            layout: { row: 5, colSpan: 1 },
          },
          {
            name: "backgroundColor",
            label: "Background Color",
            type: "color",
            defaultValue: "#ffffff",
            layout: { row: 5, colSpan: 1 },
          },
          {
            name: "showValue",
            label: "Show encoded value",
            type: "checkbox",
            defaultValue: true,
            description: "Display the encoded text below supported barcode formats.",
            layout: { row: 6, colSpan: 2 },
          },
        ],
        submit: {
          icon: Barcode,
          label: "Generate Barcode",
          loadingLabel: "Generating...",
        },
      },
      secondary: {
        title: "Preview",
        description:
          "Review the final barcode before choosing an export format.",
        chips: [
          { icon: Eye, label: "Live preview" },
          { icon: Download, label: "Download PNG/SVG" },
        ],
        slot: "barcode-generator.preview",
      },
      analytics: {
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
      },
      data: {
        title: "Recent Barcodes",
        description: "Review generated barcode records and reuse recent payloads.",
        chips: [{ icon: Barcode, label: "Saved barcodes" }, {icon: RefreshCw, label: "Auto-Refresh in 10 second"}],
        api: {
          path: "/barcodes",
          method: "GET",
          responsePath: "data",
          cacheTags: ["barcodes"],
        },
        deleteAction: {
          api: {
            path: "/barcodes/:id",
            method: "DELETE",
            cacheTags: ["barcodes"],
          },
          subjectValueTemplate: "{format} — {content}",
          eyebrow: "Delete Barcode",
          title: "Confirm removal",
          subjectLabel: "You are about to delete:",
          confirmKeyword: "confirm",
          confirmLabel: "Delete Barcode",
          loadingLabel: "Deleting...",
          successMessage: "Barcode deleted.",
          errorMessage: "Failed to delete barcode.",
          successEvent: "barcode-data-changed",
        },
        pagination: {
          enabled: true,
          pageSize: 10,
          itemLabel: "barcodes",
        },
        columns: [
          { key: "format", label: "Format" },
          { key: "content", label: "Content" },
          { key: "downloadCount", label: "Downloads" },
          { key: "createdAt", label: "Created" },
        ],
        rowSlot: "barcode-generator.row",
        emptyState: {
          icon: Barcode,
          title: "No barcodes yet",
          description:
            "Generate a barcode from the form and recent records will appear here.",
        },
      },
    },
  };
}

export async function toolSchema(headers?: HeadersInit) {
  const response = await GetBarcodeFormats(headers);
  const formats =
    "result" in response ? (response.result.data.formats ?? []) : [];

  return createBarcodeGeneratorToolSchema(formats);
}
