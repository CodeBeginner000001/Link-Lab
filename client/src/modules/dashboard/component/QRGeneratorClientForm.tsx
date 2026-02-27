"use client";

import UrlInput from "@/components/common/UrlInput";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { cn } from "@/utils/tailwindcss-merger";
import { Loader2, QrCode } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useMemo, useState, useTransition } from "react";
import { QR_CONTENT_CONFIG, QRContentType, WiFiFormState, WifiSecurityType } from "../interface/qrGeneratorConfig";

type BasicContentType = Exclude<QRContentType, "wifi">;


const MAX_TEXT_WORDS = 400;

const getInitialContentByType = () => ({
  url: "",
  text: "",
  email: "",
});

const countWords = (value: string) => {
  const words = value.match(/\S+/g);
  return words ? words.length : 0;
};

const trimToWordLimit = (value: string, limit: number) => {
  const words = value.match(/\S+/g);
  if (!words || words.length <= limit) {
    return value;
  }

  return words.slice(0, limit).join(" ");
};

const buildWifiPayload = ({
  ssid,
  security,
  password,
  hidden,
}: WiFiFormState) => {
  const trimmedSSID = ssid.trim();
  const trimmedPassword = password.trim();
  const passwordPart = security === "nopass" ? "" : `P:${trimmedPassword};`;
  const hiddenPart = hidden ? "H:true;" : "";

  return `WIFI:T:${security};S:${trimmedSSID};${passwordPart}${hiddenPart};`;
};

export default function QRGeneratorClientForm({
  initialType,
  onPreviewChange,
}: {
  initialType: QRContentType;
  onPreviewChange: (payload: { type: QRContentType; content: string }) => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [selectedType, setSelectedType] = useState<QRContentType>(initialType);
  const [contentByType, setContentByType] = useState(getInitialContentByType());
  const [wifiForm, setWifiForm] = useState<WiFiFormState>({
    ssid: "",
    security: "WPA",
    password: "",
    hidden: false,
  });

  const selectedConfig = QR_CONTENT_CONFIG[selectedType];
  const textWordCount = useMemo(
    () => countWords(contentByType.text),
    [contentByType.text],
  );
  const selectedContent = useMemo(
    () =>
      selectedType === "wifi"
        ? buildWifiPayload(wifiForm)
        : contentByType[selectedType],
    [selectedType, wifiForm, contentByType],
  );
  const isWifiValid = useMemo(() => {
    const hasSSID = Boolean(wifiForm.ssid.trim());
    const hasPassword =
      wifiForm.security === "nopass" || Boolean(wifiForm.password.trim());

    return hasSSID && hasPassword;
  }, [wifiForm]);
  const canSubmit =
    selectedType === "wifi" ? isWifiValid : Boolean(selectedContent.trim());

  useEffect(() => {
    onPreviewChange({
      type: selectedType,
      content: selectedContent,
    });
  }, [onPreviewChange, selectedType, selectedContent]);

  const handleTypeChange = (type: QRContentType) => {
    setSelectedType(type);
  };

  const handleContentChange = (type: BasicContentType, content: string) => {
    setContentByType((prev) => ({
      ...prev,
      [type]: content,
    }));
  };

  const handleWiFiFieldChange = <K extends keyof WiFiFormState>(
    key: K,
    value: WiFiFormState[K],
  ) => {
    setWifiForm((prev) => ({
      ...prev,
      [key]: value,
      ...(key === "security" && value === "nopass" ? { password: "" } : {}),
    }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    params.set("type", selectedType);
    params.delete("content");

    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <div className="grid grid-cols-4 gap-2 rounded-lg border border-[hsl(var(--border))] p-2">
        {(
          Object.entries(QR_CONTENT_CONFIG) as [
            QRContentType,
            typeof selectedConfig,
          ][]
        ).map(([type, config]) => (
          <button
            key={type}
            type="button"
            onClick={() => handleTypeChange(type)}
            className={cn(
              "rounded-md px-3 py-2 text-center text-sm font-medium transition-colors",
              selectedType === type
                ? "bg-[hsl(var(--background))] text-white"
                : "text-[hsl(var(--muted-foreground)/0.9)] hover:bg-[hsl(var(--secondary)/0.6)]",
            )}
          >
            {config.label}
          </button>
        ))}
      </div>

      {selectedType === "url" ? (
        <UrlInput
          id="content"
          name="content"
          label={selectedConfig.fieldLabel}
          required
          value={contentByType.url}
          onChange={(event) => handleContentChange("url", event.target.value)}
          placeholder={selectedConfig.placeholder}
        />
      ) : selectedType === "text" ? (
        <div className="grid gap-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="content">{selectedConfig.fieldLabel}</Label>
            <span className="text-xs text-[hsl(var(--muted-foreground)/0.8)]">
              {textWordCount}/{MAX_TEXT_WORDS} words
            </span>
          </div>
          <textarea
            id="content"
            name="content"
            required
            rows={6}
            value={contentByType.text}
            onChange={(event) =>
              handleContentChange(
                "text",
                trimToWordLimit(event.target.value, MAX_TEXT_WORDS),
              )
            }
            placeholder={selectedConfig.placeholder}
            className="w-full rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm ring-offset-[hsl(var(--background))] placeholder:text-[hsl(var(--muted-foreground)/0.9)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>
      ) : selectedType === "email" ? (
        <div className="grid gap-2">
          <Label htmlFor="content">{selectedConfig.fieldLabel}</Label>
          <Input
            id="content"
            name="content"
            type="email"
            required
            value={contentByType.email}
            onChange={(event) =>
              handleContentChange("email", event.target.value)
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
              name="wifi-ssid"
              type="text"
              required
              value={wifiForm.ssid}
              onChange={(event) =>
                handleWiFiFieldChange("ssid", event.target.value)
              }
              placeholder="MyNetwork"
              className="h-11"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="wifi-security">Security Type</Label>
            <select
              id="wifi-security"
              name="wifi-security"
              value={wifiForm.security}
              onChange={(event) =>
                handleWiFiFieldChange(
                  "security",
                  event.target.value as WifiSecurityType,
                )
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
              name="wifi-password"
              type="text"
              required={wifiForm.security !== "nopass"}
              disabled={wifiForm.security === "nopass"}
              value={wifiForm.password}
              onChange={(event) =>
                handleWiFiFieldChange("password", event.target.value)
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
              name="wifi-hidden"
              type="checkbox"
              checked={wifiForm.hidden}
              onChange={(event) =>
                handleWiFiFieldChange("hidden", event.target.checked)
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

      <Button
        type="submit"
        className="w-full rounded-lg cursor-pointer"
        disabled={isPending || !canSubmit}
      >
        {isPending ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <QrCode className="w-5 h-5" />
        )}
        {isPending ? "Generating..." : "Generate QR Code"}
      </Button>
    </form>
  );
}
