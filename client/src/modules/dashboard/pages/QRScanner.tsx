"use client";

import { Button } from "@/components/ui/Button";
import { useToastNotification } from "@/utils/toast";
import {
  Camera,
  Copy,
  ExternalLink,
  ScanLine,
  Upload,
} from "lucide-react";
import Image from "next/image";
import { ChangeEvent, useRef, useState } from "react";
import ToolEmptyState from "../component/common/ToolEmptyState";
import ToolFeaturePill from "../component/common/ToolFeaturePill";
import ToolInfoCard from "../component/common/ToolInfoCard";
import ToolLoadingState from "../component/common/ToolLoadingState";
import ToolPageShell from "../component/common/ToolPageShell";
import ToolPanel from "../component/common/ToolPanel";
import ToolPillGroup from "../component/common/ToolPillGroup";
import ToolUploadZone from "../component/common/ToolUploadZone";

type ScanResult = {
  value: string;
  type: string;
  canOpen: boolean;
};

const mockResults: ScanResult[] = [
  {
    value: "https://example.com/product/12345",
    type: "URL",
    canOpen: true,
  },
  {
    value: "mailto:contact@example.com",
    type: "Email",
    canOpen: false,
  },
  {
    value: "WIFI:S:HomeNetwork;T:WPA;P:password123;;",
    type: "WiFi",
    canOpen: false,
  },
  {
    value: "https://github.com/user/repo",
    type: "URL",
    canOpen: true,
  },
];

const QRScanner = () => {
  const notify = useToastNotification();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [scannedResult, setScannedResult] = useState<ScanResult | null>(null);

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = async (loadEvent) => {
      setPreviewImage(loadEvent.target?.result as string);
      setScannedResult(null);
      setIsScanning(true);

      await new Promise((resolve) => setTimeout(resolve, 1100));
      const nextResult =
        mockResults[Math.floor(Math.random() * mockResults.length)];
      setScannedResult(nextResult);
      setIsScanning(false);
      notify("QR code decoded.", "success");
    };

    reader.onerror = () => {
      notify("Unable to read the selected image.", "error");
    };

    reader.readAsDataURL(file);
  };

  const copyResult = async () => {
    if (!scannedResult) {
      return;
    }

    try {
      await navigator.clipboard.writeText(scannedResult.value);
      notify("Scan result copied.", "success");
    } catch {
      notify("Unable to copy the scan result.", "error");
    }
  };

  const openResult = () => {
    if (scannedResult?.canOpen) {
      window.open(scannedResult.value, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <ToolPageShell
      icon={ScanLine}
      heading="QR Code Scanner"
      para="Instantly scan and decode QR codes from images."
      iconClassName="h-6 w-6 text-primary"
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.96fr)_minmax(0,1.04fr)]">
          <ToolPanel
            heading="Upload QR Code"
            para="Choose an image containing a QR code. The scanner preview and decoded content will update after processing."
            headerSlot={<ToolFeaturePill icon={Upload} label="Image upload" />}
          >
            <ToolPillGroup className="mb-5">
              <ToolFeaturePill icon={ScanLine} label="Image scanning" />
              <ToolFeaturePill icon={Camera} label="Camera placeholder" />
              <ToolFeaturePill icon={Copy} label="Copy decoded value" />
            </ToolPillGroup>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            <div className="space-y-4">
              <ToolUploadZone
                icon={Upload}
                title="Drop image here or click to upload"
                description="Upload JPG, PNG, or GIF files containing a QR code."
                hint="Preview supported"
                onClick={() => fileInputRef.current?.click()}
                preview={
                  previewImage ? (
                    <div className="relative h-[220px] w-full overflow-hidden rounded-2xl">
                      <Image
                        src={previewImage}
                        alt="QR code preview"
                        fill
                        unoptimized
                        className="object-contain"
                      />
                    </div>
                  ) : undefined
                }
              />

              <Button variant="outline" className="w-full" disabled>
                <Camera className="h-4 w-4" />
                Use Camera
              </Button>
            </div>
          </ToolPanel>

          <ToolPanel
            heading="Scan Result"
            para={
              scannedResult
                ? "Review the decoded content and take action below."
                : "Decoded QR content will appear here once an image has been scanned."
            }
            headerSlot={
              scannedResult ? (
                <ToolFeaturePill label={scannedResult.type} />
              ) : undefined
            }
          >
            {isScanning ? (
              <ToolLoadingState
                title="Scanning QR code..."
                description="Processing the uploaded image and extracting the payload."
              />
            ) : scannedResult ? (
              <div className="space-y-5">
                <ToolInfoCard
                  eyebrow="Decoded content"
                  title={scannedResult.value}
                  titleClassName="break-all font-mono text-sm text-[hsl(var(--foreground))]"
                  className="bg-[hsl(var(--secondary)/0.26)]"
                />

                <ToolPillGroup>
                  <ToolFeaturePill icon={ScanLine} label={scannedResult.type} />
                  <ToolFeaturePill
                    icon={Upload}
                    label={previewImage ? "Preview loaded" : "No preview"}
                  />
                </ToolPillGroup>

                <ToolPillGroup>
                  <Button variant="outline" onClick={copyResult}>
                    <Copy className="h-4 w-4" />
                    Copy
                  </Button>
                  {scannedResult.canOpen ? (
                    <Button onClick={openResult}>
                      <ExternalLink className="h-4 w-4" />
                      Open Link
                    </Button>
                  ) : null}
                </ToolPillGroup>
              </div>
            ) : (
              <ToolEmptyState
                icon={ScanLine}
                title="No scan result yet"
                description="Upload a QR code image and the decoded text or link will appear here."
              />
            )}
          </ToolPanel>
      </div>
    </ToolPageShell>
  );
};

export default QRScanner;
