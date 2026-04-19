"use client";

import { Button } from "@/components/ui/Button";
import { Loader2, QrCode } from "lucide-react";
import {
  QRContentType,
  WiFiFormState,
} from "../../interface/qrGeneratorConfig";
import { QRStyleDraft } from "../../interface/qrGeneratorStyle";
import { QRBasicContentState } from "./qr-builder.helpers";
import QRContentHandler from "./QRContentHandler";
import QRStyleBuilder from "./QRStyleBuilder";

type QRBuilderProps = {
  selectedType: QRContentType;
  contentByType: QRBasicContentState;
  wifiForm: WiFiFormState;
  style: QRStyleDraft;
  canGenerate: boolean;
  isGenerating: boolean;
  isLocked: boolean;
  onTypeChange: (type: QRContentType) => void;
  onBasicContentChange: (
    type: keyof QRBasicContentState,
    value: string,
  ) => void;
  onWifiFieldChange: (patch: Partial<WiFiFormState>) => void;
  onStyleChange: (patch: Partial<QRStyleDraft>) => void;
  onGenerate: () => void;
};

export default function QRBuilder({
  selectedType,
  contentByType,
  wifiForm,
  style,
  canGenerate,
  isGenerating,
  isLocked,
  onTypeChange,
  onBasicContentChange,
  onWifiFieldChange,
  onStyleChange,
  onGenerate,
}: QRBuilderProps) {
  return (
    <div className="space-y-6">
      <QRContentHandler
        selectedType={selectedType}
        contentByType={contentByType}
        wifiForm={wifiForm}
        disabled={isLocked}
        onTypeChange={onTypeChange}
        onBasicContentChange={onBasicContentChange}
        onWifiFieldChange={onWifiFieldChange}
      />

      <QRStyleBuilder
        style={style}
        disabled={isLocked}
        onStyleChange={onStyleChange}
      />

      {isLocked ? (
        <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.18)] p-4">
          <p className="text-sm font-semibold text-[hsl(var(--foreground))]">
            Saved QR locked
          </p>
          <p className="mt-1 text-sm text-[hsl(var(--muted-foreground)/0.9)]">
            Content and styling are kept for reference. Download the saved QR from
            panel 2 or use the reset action there to start a new one.
          </p>
        </div>
      ) : (
        <Button
          type="button"
          onClick={onGenerate}
          disabled={!canGenerate || isGenerating}
          className="w-full sm:w-auto"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <QrCode className="h-4 w-4" />
              Generate Preview
            </>
          )}
        </Button>
      )}
    </div>
  );
}
