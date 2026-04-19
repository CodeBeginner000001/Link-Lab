"use client";

import ToolFeaturePill from "../common/ToolFeaturePill";
import ToolPanel from "../common/ToolPanel";
import { Palette, QrCode } from "lucide-react";
import { ComponentProps } from "react";
import QRBuilder from "./QRBuilder";
import QRPreviewBuilder from "./QRPreviewBuilder";

type QRPhoneViewProps = {
  builderProps: ComponentProps<typeof QRBuilder>;
  previewProps: ComponentProps<typeof QRPreviewBuilder>;
};

export default function QRPhoneView({
  builderProps,
  previewProps,
}: QRPhoneViewProps) {
  return (
    <div className="space-y-6 xl:hidden">
      <ToolPanel
        heading="Panel 1 · QR Builder"
        para="Build the QR content and style before generating the preview."
        headerSlot={<ToolFeaturePill icon={Palette} label="Builder" />}
      >
        <QRBuilder {...builderProps} />
      </ToolPanel>

      <ToolPanel
        heading="Panel 2 · Preview"
        para="Save the preview to the server before you download it."
        headerSlot={<ToolFeaturePill icon={QrCode} label="Preview" />}
      >
        <QRPreviewBuilder {...previewProps} />
      </ToolPanel>
    </div>
  );
}
