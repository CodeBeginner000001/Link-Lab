"use client";

import {
  GenerateBarcode,
  NotifyBarcodeDataChanged,
} from "@/service/dashboard/barcode-generator";
import { BarcodeFormatOption } from "@/service/dashboard/barcode-generator/type";
import { BarcodeItem } from "@/service/dashboard/barcode-generator/type";
import { useToastNotification } from "@/utils/toast";
import { FormEvent, useState } from "react";
import BarcodeColorFields from "./form/BarcodeColorFields";
import BarcodeContentField from "./form/BarcodeContentField";
import BarcodeDimensionsFields from "./form/BarcodeDimensionsFields";
import BarcodeFormatField from "./form/BarcodeFormatField";
import BarcodeGenerateButton from "./form/BarcodeGenerateButton";
import BarcodeMarginField from "./form/BarcodeMarginField";
import BarcodeValueOption from "./form/BarcodeValueOption";

export default function BarcodeFormPanel({
  formats,
  onGenerated,
}: {
  formats: BarcodeFormatOption[];
  onGenerated: (barcode: BarcodeItem) => void;
}) {
  const notify = useToastNotification();
  const [format, setFormat] = useState(formats[0]?.value ?? "");
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const selectedFormat =
    formats.find((option) => option.value === format) ?? formats[0];

  const handleFormatChange = (value: string) => {
    setFormat(value);
    setContent("");
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!selectedFormat || !content.trim()) {
      notify("Select a format and enter valid barcode content.", "warning");
      return;
    }

    const formData = new FormData(event.currentTarget);

    try {
      setIsLoading(true);
      const response = await GenerateBarcode({
        format: selectedFormat.value,
        content: content.trim(),
        barWidth: Number(formData.get("barWidth")),
        height: Number(formData.get("height")),
        margin: Number(formData.get("margin")),
        barColor: String(formData.get("barColor")),
        backgroundColor: String(formData.get("backgroundColor")),
        showValue: formData.has("showValue"),
      });

      if ("error" in response) {
        const rawMessage = response.error.message;
        const message = Array.isArray(rawMessage)
          ? (rawMessage[0] ?? "Failed to generate barcode.")
          : (rawMessage ?? "Failed to generate barcode.");
        notify(message, "error");
        return;
      }

      const barcode = response.result.data.barcode;
      onGenerated(barcode);
      NotifyBarcodeDataChanged();
      notify("Barcode generated successfully.", "success");
    } catch {
      notify("Something went wrong. Please try again.", "error");
    } finally {
      setIsLoading(false);
    }
  };

  if (!selectedFormat) {
    return (
      <p className="text-sm text-[hsl(var(--muted-foreground))]">
        Barcode formats are unavailable.
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5 max-md:space-y-4 max-md:[&_input]:h-10 max-md:[&_label]:text-sm max-md:[&_p]:text-[11px]"
    >
      <BarcodeFormatField
        formats={formats}
        value={selectedFormat.value}
        onChange={handleFormatChange}
      />
      <BarcodeContentField
        format={selectedFormat}
        value={content}
        onChange={setContent}
      />
      <BarcodeDimensionsFields />
      <BarcodeMarginField />
      <BarcodeColorFields />
      <BarcodeValueOption />
      <BarcodeGenerateButton isLoading={isLoading} />
    </form>
  );
}
