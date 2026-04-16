"use client";

import { QrCode } from "lucide-react";
import { useState } from "react";
import { QR_CONTENT_CONFIG, QRContentType } from "../../interface/qrGeneratorConfig";
import QRGeneratorClientForm from "./QRGeneratorClientForm";
import BoxHeading from "../common/BoxHeading";

export default function QRGeneratorClientPanel({
  initialType,
}: {
  initialType: QRContentType;
}) {
  const [preview, setPreview] = useState<{
    type: QRContentType;
    content: string;
  }>({
    type: initialType,
    content: "",
  });

  const selectedConfig = QR_CONTENT_CONFIG[preview.type];

  return (
    <div className="flex gap-6 w-full">
      <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 w-full">
        <BoxHeading
          heading="Create QR Code"
          para="Enter your content and generate a QR code"
        />

        <QRGeneratorClientForm
          initialType={initialType}
          onPreviewChange={setPreview}
        />
      </div>

      <div className="rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-6 w-full flex flex-col gap-6 items-center">
        <BoxHeading
          heading="Preview"
          para="Your generated QR code will appear here"
          sectionClassName="self-start"
        />
        <div className="w-74 h-74 rounded-lg border border-[hsl(var(--border))] flex items-center justify-center bg-[hsl(var(--secondary)/0.3)]">
          <div className="text-center text-[hsl(var(--muted-foreground)/0.8)]">
            <QrCode className="w-16 h-16 mx-auto mb-2 opacity-30" />
            <p>QR code will appear here</p>
          </div>
        </div>
        <div className="space-y-1 text-center">
          <p className="text-sm text-[hsl(var(--muted-foreground)/0.8)]">
            Type:{" "}
            <span className="font-medium text-foreground">
              {selectedConfig.label}
            </span>
          </p>
          <p className="max-w-full break-all text-xs text-[hsl(var(--muted-foreground)/0.8)]">
            {preview.content || selectedConfig.placeholder}
          </p>
        </div>
      </div>
    </div>
  );
};