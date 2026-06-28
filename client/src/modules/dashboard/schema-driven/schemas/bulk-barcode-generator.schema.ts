import {
  BarChart3,
  Barcode,
  FileSpreadsheet,
  FileText,
  Layers3,
  RefreshCw,
  Sparkles,
  Upload,
} from "lucide-react";
import type { FeatureToolSchema } from "../types";

const BULK_BARCODE_MIN_ROWS = 5;
const BULK_BARCODE_MAX_ROWS = 10000;
const BULK_BARCODE_MAX_FILE_SIZE_MB = 5;
const BULK_BARCODE_ROW_LIMIT_LABEL = `${BULK_BARCODE_MIN_ROWS} to ${BULK_BARCODE_MAX_ROWS.toLocaleString()} rows`;

export type BulkBarcodeGeneratorFormValues = {
  generationMode: string;
  bulkFile: File | null;
  autoFormat: string;
  autoCount: number;
  barWidth: number;
  height: number;
  margin: number;
  barColor: string;
  backgroundColor: string;
  showValue: boolean;
};

export type BulkBarcodeListItem = {
  id: string;
  fileName: string;
  totalRows: number;
  generatedCount: number;
  failedCount: number;
  totalDownloads?: number;
  downloadCounts?: {
    zip: number;
    pdf: number;
  };
  status: string;
  createdAt: string;
};

export type BulkBarcodeAnalytics = {
  totals: {
    batches: number;
    generated: number;
    downloads: number;
  };
};

export const toolSchema: FeatureToolSchema<
  BulkBarcodeGeneratorFormValues,
  BulkBarcodeListItem,
  BulkBarcodeAnalytics
> = {
  slug: "bulk-barcode-generator",
  route: "/dashboard/bulk-barcode-generator",
  header: {
    icon: Layers3,
    title: "Bulk Barcode Generator",
    description:
      "Upload CSV, XLSX, or JSON files and generate barcode batches in one run.",
    canonical: "/dashboard/bulk-barcode-generator",
  },
  panels: {
    form: {
      title: "Upload Barcode File",
      description:
        `Upload CSV, XLSX, or JSON with content, format, and optional label fields. Bulk uploads require at least ${BULK_BARCODE_MIN_ROWS} rows.`,
      responsiveChip: {
        icon: Sparkles,
        label: "Schema upload",
      },
      chips: [
        { icon: FileSpreadsheet, label: "CSV, XLSX, JSON" },
        { icon: Sparkles, label: "Auto generate" },
        { icon: Barcode, label: BULK_BARCODE_ROW_LIMIT_LABEL },
        { icon: Upload, label: `${BULK_BARCODE_MAX_FILE_SIZE_MB} MB max` },
      ],
      api: {
        path: "/bulk-barcodes",
        method: "POST",
        cacheTags: ["bulk-barcodes"],
      },
      successEvent: "bulk-barcode-data-changed",
      fields: [
        {
          name: "generationMode",
          label: "Generation Mode",
          type: "select",
          required: true,
          defaultValue: "upload",
          layout: { row: 1, colSpan: 2 },
          options: [
            {
              label: "Upload file",
              value: "upload",
              description: "Generate barcodes from CSV, XLSX, or JSON.",
            },
            {
              label: "Auto generate",
              value: "auto",
              description: "Generate valid barcode values without a file.",
            },
          ],
        },
        {
          name: "bulkFile",
          label: "Barcode Upload",
          type: "upload",
          required: true,
          visibleWhen: { field: "generationMode", equals: "upload" },
          acceptedExtensions: [".csv", ".xlsx", ".json"],
          accept:
            ".csv,.xlsx,.json,text/csv,application/json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          maxSizeMb: BULK_BARCODE_MAX_FILE_SIZE_MB,
          minRows: BULK_BARCODE_MIN_ROWS,
          maxRows: BULK_BARCODE_MAX_ROWS,
          description:
            "Use exactly one .csv, .xlsx, or .json file. Fields: content, format, label. Formats: CODE128, EAN13, UPCA, CODE39, ITF14.",
          layout: { row: 2, colSpan: 2 },
        },
        {
          name: "autoFormat",
          label: "Auto Format",
          type: "select",
          required: true,
          defaultValue: "CODE128",
          visibleWhen: { field: "generationMode", equals: "auto" },
          layout: { row: 2, colSpan: 1 },
          options: [
            { label: "Code 128", value: "CODE128" },
            { label: "Code 39", value: "CODE39" },
            { label: "EAN-13", value: "EAN13" },
            { label: "UPC-A", value: "UPCA" },
            { label: "ITF-14", value: "ITF14" },
          ],
        },
        {
          name: "autoCount",
          label: "Auto Count",
          type: "number",
          required: true,
          defaultValue: BULK_BARCODE_MIN_ROWS,
          visibleWhen: { field: "generationMode", equals: "auto" },
          layout: { row: 2, colSpan: 1 },
          validation: {
            min: BULK_BARCODE_MIN_ROWS,
            max: BULK_BARCODE_MAX_ROWS,
            step: 1,
          },
        },
        {
          name: "barWidth",
          label: "Bar Width",
          type: "number",
          defaultValue: 2,
          layout: { row: 3, colSpan: 1 },
          validation: { min: 1, max: 5, step: 1 },
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
          description: "Display encoded text below supported barcode formats.",
          layout: { row: 6, colSpan: 2 },
        },
      ],
      submit: {
        icon: Layers3,
        label: "Generate Bulk Barcodes",
        loadingLabel: "Generating...",
      },
    },
    secondary: {
      title: "Upload Templates",
      description:
        "Download a starter template in your preferred upload format.",
      chips: [
        { icon: FileSpreadsheet, label: "CSV, XLSX, JSON" },
        { icon: Barcode, label: "content, format, label" },
      ],
      slot: "bulk-barcode-generator.template",
    },
    analytics: {
      title: "Bulk Barcode Analytics",
      description:
        "Review upload batches, generated barcodes, download volume, weekly activity, and export mix.",
      chips: [{ icon: BarChart3, label: "Weekly analytics" }],
      api: {
        path: "/bulk-barcodes/analytics",
        method: "GET",
        responsePath: "data",
        cacheTags: ["bulk-barcodes"],
      },
      cards: [
        { icon: Layers3, label: "Batches", valuePath: "batches" },
        { icon: Barcode, label: "Generated", valuePath: "generated" },
        { icon: FileText, label: "Downloads", valuePath: "downloads" },
      ],
      sections: [
        {
          type: "activity",
          api: {
            path: "/bulk-barcodes/analytics/activity/:period/:date",
            method: "GET",
            responsePath: "data",
            useProxy: true,
            cacheTags: ["bulk-barcodes"],
          },
          defaultPeriod: "week",
          titleByPeriod: {
            week: "Weekly uploads",
            month: "Monthly uploads",
            year: "Yearly uploads",
          },
          descriptionTemplate: "Bulk upload batches in the selected {period}",
          refreshEvent: "bulk-barcode-data-changed",
        },
        {
          type: "distribution",
          api: {
            path: "/bulk-barcodes/analytics/export-mix",
            method: "GET",
            responsePath: "data",
            cacheTags: ["bulk-barcodes"],
          },
          title: "Export type",
          description: "Download count by export format",
          valuePath: "exportTypeDistribution",
          emptyText: "Download a PDF or ZIP to see export type counts.",
          secondary: {
            title: "Download formats",
            totalLabel: "Total",
            segments: [
              {
                label: "ZIP",
                valuePath: "downloadFormatDistribution.zip",
                className: "bg-[hsl(var(--primary))]",
              },
              {
                label: "PDF",
                valuePath: "downloadFormatDistribution.pdf",
                className: "bg-indigo-500",
              },
            ],
          },
        },
      ],
    },
    data: {
      title: "Bulk Barcode Uploads",
      description: "Review previous bulk barcode generation batches.",
      chips: [
        { icon: Layers3, label: "Saved batches" },
        { icon: RefreshCw, label: "Auto-Refresh in 10 second" },
      ],
      api: {
        path: "/bulk-barcodes",
        method: "GET",
        responsePath: "data",
        cacheTags: ["bulk-barcodes"],
      },
      deleteAction: {
        api: {
          path: "/bulk-barcodes/:id",
          method: "DELETE",
          cacheTags: ["bulk-barcodes"],
        },
        subjectValuePath: "fileName",
        eyebrow: "Delete Bulk Upload",
        title: "Confirm removal",
        subjectLabel: "You are about to delete:",
        confirmKeyword: "confirm",
        confirmLabel: "Delete Upload",
        loadingLabel: "Deleting...",
        successMessage: "Bulk barcode upload deleted.",
        errorMessage: "Failed to delete bulk barcode upload.",
        successEvent: "bulk-barcode-data-changed",
      },
      pagination: {
        enabled: true,
        pageSize: 10,
        itemLabel: "bulk uploads",
      },
      columns: [
        { key: "fileName", label: "Name" },
        { key: "totalRows", label: "Total Rows" },
        { key: "generatedCount", label: "Success" },
        { key: "failedCount", label: "Fails" },
        { key: "createdAt", label: "Created" },
        { key: "actions", label: "Actions", className: "text-right" },
      ],
      emptyState: {
        icon: Layers3,
        title: "No bulk uploads yet",
        description:
          "Upload a barcode file and completed batches will appear here.",
      },
    },
  },
  mapAnalytics: (response) => {
    const data = response as {
      batches?: number;
      generated?: number;
      downloads?: number;
      exportTypeDistribution?: Array<Record<string, unknown>>;
      downloadFormatDistribution?: {
        zip?: number;
        pdf?: number;
      };
    };

    return {
      totals: {
        batches: data.batches ?? 0,
        generated: data.generated ?? 0,
        downloads: data.downloads ?? 0,
      },
      batches: data.batches ?? 0,
      generated: data.generated ?? 0,
      downloads: data.downloads ?? 0,
      exportTypeDistribution: data.exportTypeDistribution ?? [],
      downloadFormatDistribution: data.downloadFormatDistribution ?? {
        zip: 0,
        pdf: 0,
      },
    };
  },
};
