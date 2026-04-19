"use client";

import ToolFeaturePill from "../common/ToolFeaturePill";
import ToolPanel from "../common/ToolPanel";
import ToolPillGroup from "../common/ToolPillGroup";
import { Circle, Eye, Palette, QrCode } from "lucide-react";
import { ComponentProps } from "react";
import QRBuilder from "./QRBuilder";
import QRPreviewBuilder from "./QRPreviewBuilder";

type QRDesktopViewProps = {
  builderProps: ComponentProps<typeof QRBuilder>;
  previewProps: ComponentProps<typeof QRPreviewBuilder>;
};

export default function QRDesktopView({
  builderProps,
  previewProps,
}: QRDesktopViewProps) {
  return (
    <div className="hidden xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(380px,0.95fr)] xl:gap-6">
      <ToolPanel
        heading="Panel 1 · QR Builder"
        para="Add content, adjust styling, and generate the draft preview."
        headerSlot={<ToolFeaturePill icon={Palette} label="Builder controls" />}
      >
        <ToolPillGroup className="mb-5">
          <ToolFeaturePill icon={QrCode} label="Content handler" />
          <ToolFeaturePill icon={Eye} label="Eye styling" />
          <ToolFeaturePill icon={Circle} label="Body styling" />
        </ToolPillGroup>

        <QRBuilder {...builderProps} />
      </ToolPanel>

      <ToolPanel
        heading="Panel 2 · Preview"
        para="Review the generated QR, save it to the server, then download it."
        headerSlot={<ToolFeaturePill icon={QrCode} label="Preview builder" />}
      >
        <QRPreviewBuilder {...previewProps} />
      </ToolPanel>
    </div>
  );
}
