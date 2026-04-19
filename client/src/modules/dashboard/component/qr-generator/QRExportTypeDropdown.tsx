"use client";

import { Button } from "@/components/ui/Button";
import { QrExportType } from "@/service/dashboard/qr-generator/type";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/DropDownMenu";
import { cn } from "@/utils/tailwindcss-merger";
import { ChevronDown } from "lucide-react";
import { QR_DOWNLOAD_EXPORT_OPTIONS, QRExportOption } from "./qr-export-options";

type QRExportTypeDropdownProps = {
  value: QrExportType | "";
  onChange: (value: QrExportType) => void;
  placeholder?: string;
  disabled?: boolean;
  triggerClassName?: string;
  contentClassName?: string;
  options?: QRExportOption[];
};

export default function QRExportTypeDropdown({
  value,
  onChange,
  placeholder = "Select export type",
  disabled = false,
  triggerClassName,
  contentClassName,
  options = QR_DOWNLOAD_EXPORT_OPTIONS,
}: QRExportTypeDropdownProps) {
  const selectedOption = options.find((option) => option.value === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn(
            "h-10 w-full justify-between rounded-xl border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 text-sm font-medium text-[hsl(var(--foreground))]",
            triggerClassName,
          )}
        >
          <span
            className={cn(
              "truncate",
              selectedOption
                ? "text-[hsl(var(--foreground))]"
                : "text-[hsl(var(--muted-foreground))]",
            )}
          >
            {selectedOption?.label ?? placeholder}
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-[hsl(var(--muted-foreground))]" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        className={cn(
          "max-h-64 w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto overscroll-contain rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-1.5 shadow-xl",
          contentClassName,
        )}
      >
        <DropdownMenuRadioGroup
          value={value}
          onValueChange={(nextValue) => onChange(nextValue as QrExportType)}
        >
          {options.map((option) => (
            <DropdownMenuRadioItem
              key={option.value}
              value={option.value}
              className="rounded-xl px-3 py-2.5 text-sm font-medium text-[hsl(var(--foreground))] focus:bg-[hsl(var(--secondary))] focus:text-[hsl(var(--foreground))]"
            >
              {option.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
