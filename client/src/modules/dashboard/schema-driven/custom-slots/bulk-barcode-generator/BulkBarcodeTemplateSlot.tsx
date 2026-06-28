"use client";

import { Button } from "@/components/ui/Button";
import { Download } from "lucide-react";

const templateRows = [
  "content,format,label",
  "123456789012,CODE128,Product 1",
  "987654321098,CODE128,Product 2",
  "ABC-2026-001,CODE128,Box A",
  "PRODUCT-004,CODE39,Item 4",
  "12345678901231,ITF14,Case 5",
];

const templateDownloads = [
  { label: "CSV", href: "/api/features/bulk-barcodes/templates/csv" },
  { label: "XLSX", href: "/api/features/bulk-barcodes/templates/xlsx" },
  { label: "JSON", href: "/api/features/bulk-barcodes/templates/json" },
];

export default function BulkBarcodeTemplateSlot() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {templateDownloads.map((template) => (
          <Button
            key={template.label}
            asChild
            type="button"
            size="sm"
            variant="outline"
          >
            <a href={template.href}>
              <Download className="h-4 w-4" />
              {template.label}
            </a>
          </Button>
        ))}
      </div>
      <div className="overflow-hidden rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.3)]">
        <pre className="overflow-x-auto p-4 text-xs leading-6 text-[hsl(var(--foreground))]">
          {templateRows.join("\n")}
        </pre>
      </div>
      <div className="grid gap-2 text-sm text-[hsl(var(--muted-foreground))]">
        <p>Required fields: content, format</p>
        <p>Optional field: label</p>
        <p>Supported formats: CODE128, EAN13, UPCA, CODE39, ITF14</p>
      </div>
    </div>
  );
}
