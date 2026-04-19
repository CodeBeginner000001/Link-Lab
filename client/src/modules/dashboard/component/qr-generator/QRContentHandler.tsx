"use client";

import UrlInput from "@/components/common/UrlInput";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import ToolSegmentedTabs from "../common/ToolSegmentedTabs";
import {
  QR_CONTENT_CONFIG,
  QRContentType,
  WiFiFormState,
  WifiSecurityType,
} from "../../interface/qrGeneratorConfig";
import {
  countWords,
  MAX_TEXT_WORDS,
  QRBasicContentState,
  trimToWordLimit,
  getDraftContent,
} from "./qr-builder.helpers";

type QRContentHandlerProps = {
  selectedType: QRContentType;
  contentByType: QRBasicContentState;
  wifiForm: WiFiFormState;
  disabled?: boolean;
  onTypeChange: (type: QRContentType) => void;
  onBasicContentChange: (
    type: keyof QRBasicContentState,
    value: string,
  ) => void;
  onWifiFieldChange: (patch: Partial<WiFiFormState>) => void;
};

export default function QRContentHandler({
  selectedType,
  contentByType,
  wifiForm,
  disabled = false,
  onTypeChange,
  onBasicContentChange,
  onWifiFieldChange,
}: QRContentHandlerProps) {
  const selectedConfig = QR_CONTENT_CONFIG[selectedType];
  const selectedContent = getDraftContent(selectedType, contentByType, wifiForm);
  const textWordCount = countWords(contentByType.text);

  return (
    <fieldset
      disabled={disabled}
      className={`space-y-5 ${disabled ? "opacity-60" : ""}`}
    >
      <ToolSegmentedTabs
        options={Object.entries(QR_CONTENT_CONFIG).map(([value, config]) => ({
          value,
          label: config.label,
        }))}
        value={selectedType}
        onValueChange={(value) => onTypeChange(value as QRContentType)}
      />

      {selectedType === "url" ? (
        <UrlInput
          id="qr-content-url"
          label={selectedConfig.fieldLabel}
          required
          value={contentByType.url}
          onChange={(event) => onBasicContentChange("url", event.target.value)}
          placeholder={selectedConfig.placeholder}
        />
      ) : selectedType === "text" ? (
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="qr-content-text">{selectedConfig.fieldLabel}</Label>
            <span className="text-xs text-[hsl(var(--muted-foreground)/0.8)]">
              {textWordCount}/{MAX_TEXT_WORDS} words
            </span>
          </div>
          <textarea
            id="qr-content-text"
            rows={6}
            value={contentByType.text}
            onChange={(event) =>
              onBasicContentChange(
                "text",
                trimToWordLimit(event.target.value, MAX_TEXT_WORDS),
              )
            }
            placeholder={selectedConfig.placeholder}
            className="w-full rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm ring-offset-[hsl(var(--background))] placeholder:text-[hsl(var(--muted-foreground)/0.9)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2"
          />
        </div>
      ) : selectedType === "email" ? (
        <div className="grid gap-2">
          <Label htmlFor="qr-content-email">{selectedConfig.fieldLabel}</Label>
          <Input
            id="qr-content-email"
            type="email"
            value={contentByType.email}
            onChange={(event) =>
              onBasicContentChange("email", event.target.value)
            }
            placeholder={selectedConfig.placeholder}
            className="h-11"
          />
        </div>
      ) : (
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="wifi-ssid">Network Name (SSID)</Label>
            <Input
              id="wifi-ssid"
              type="text"
              value={wifiForm.ssid}
              onChange={(event) =>
                onWifiFieldChange({ ssid: event.target.value })
              }
              placeholder="MyNetwork"
              className="h-11"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="wifi-security">Security Type</Label>
            <select
              id="wifi-security"
              disabled={disabled}
              value={wifiForm.security}
              onChange={(event) =>
                onWifiFieldChange({
                  security: event.target.value as WifiSecurityType,
                  ...(event.target.value === "nopass" ? { password: "" } : {}),
                })
              }
              className="h-11 rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2"
            >
              <option value="WPA">WPA/WPA2</option>
              <option value="WEP">WEP</option>
              <option value="nopass">No Password</option>
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="wifi-password">Password</Label>
            <Input
              id="wifi-password"
              type="text"
              disabled={wifiForm.security === "nopass"}
              value={wifiForm.password}
              onChange={(event) =>
                onWifiFieldChange({ password: event.target.value })
              }
              placeholder={
                wifiForm.security === "nopass"
                  ? "Not required"
                  : "Enter network password"
              }
              className="h-11"
            />
          </div>

          <label
            htmlFor="wifi-hidden"
            className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground)/0.9)]"
          >
            <input
              id="wifi-hidden"
              type="checkbox"
              disabled={disabled}
              checked={wifiForm.hidden}
              onChange={(event) =>
                onWifiFieldChange({ hidden: event.target.checked })
              }
              className="h-4 w-4 rounded border-[hsl(var(--input))]"
            />
            Hidden network
          </label>

          <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.35)] px-3 py-2">
            <p className="text-xs text-[hsl(var(--muted-foreground)/0.9)]">
              Payload Preview
            </p>
            <p className="mt-1 break-all text-xs text-[hsl(var(--foreground))]">
              {selectedContent}
            </p>
          </div>
        </div>
      )}
    </fieldset>
  );
}
