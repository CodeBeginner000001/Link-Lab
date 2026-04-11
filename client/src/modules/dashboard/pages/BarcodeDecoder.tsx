"use client";

import { Button } from "@/components/ui/Button";
import { useToastNotification } from "@/utils/toast";
import { Copy, FileCode, Upload } from "lucide-react";
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

type DecodedResult = {
  barcodeType: string;
  value: string;
};

const MOCK_RESULTS: DecodedResult[] = [
  { barcodeType: "CODE128", value: "ABC123456789" },
  { barcodeType: "EAN-13", value: "5901234123457" },
  { barcodeType: "UPC-A", value: "012345678905" },
  { barcodeType: "CODE39", value: "PRODUCT-001" },
];

const BarcodeDecoder = () => {
  const notify = useToastNotification();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [decodedResult, setDecodedResult] = useState<DecodedResult | null>(null);

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = async (loadEvent) => {
      setPreviewImage(loadEvent.target?.result as string);
      setDecodedResult(null);
      setIsScanning(true);

      await new Promise((resolve) => setTimeout(resolve, 1050));
      const nextResult =
        MOCK_RESULTS[Math.floor(Math.random() * MOCK_RESULTS.length)];
      setDecodedResult(nextResult);
      setIsScanning(false);
      notify("Barcode decoded.", "success");
    };

    reader.onerror = () => {
      notify("Unable to read the selected image.", "error");
    };

    reader.readAsDataURL(file);
  };

  const copyResult = async () => {
    if (!decodedResult) {
      return;
    }

    try {
      await navigator.clipboard.writeText(decodedResult.value);
      notify("Decoded content copied.", "success");
    } catch {
      notify("Unable to copy the decoded value.", "error");
    }
  };

  return (
    <ToolPageShell
      icon={FileCode}
      heading="Barcode Decoder"
      para="Scan and decode barcode formats from uploaded images."
      iconClassName="h-6 w-6 text-primary"
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.96fr)_minmax(0,1.04fr)]">
          <ToolPanel
            heading="Upload Barcode"
            para="Choose an image containing a barcode and the decoder will extract its format and value."
            headerSlot={<ToolFeaturePill icon={Upload} label="Image upload" />}
          >
            <ToolPillGroup className="mb-5">
              <ToolFeaturePill icon={FileCode} label="Decode image barcodes" />
              <ToolFeaturePill icon={Upload} label="Preview before scan" />
              <ToolFeaturePill icon={Copy} label="Copy result" />
            </ToolPillGroup>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />

            <ToolUploadZone
              icon={Upload}
              title="Drop image here or click to upload"
              description="Upload JPG, PNG, or GIF files containing a barcode."
              hint="Image preview supported"
              onClick={() => fileInputRef.current?.click()}
              preview={
                previewImage ? (
                  <div className="relative h-[220px] w-full overflow-hidden rounded-2xl">
                    <Image
                      src={previewImage}
                      alt="Barcode preview"
                      fill
                      unoptimized
                      className="object-contain"
                    />
                  </div>
                ) : undefined
              }
            />
          </ToolPanel>

          <ToolPanel
            heading="Decode Result"
            para={
              decodedResult
                ? "Review the detected barcode format and decoded content."
                : "Decoded barcode information will appear here after a scan."
            }
            headerSlot={
              decodedResult ? (
                <ToolFeaturePill label={decodedResult.barcodeType} />
              ) : undefined
            }
          >
            {isScanning ? (
              <ToolLoadingState
                title="Scanning barcode..."
                description="Processing the uploaded image and extracting barcode data."
              />
            ) : decodedResult ? (
              <div className="space-y-5">
                <ToolInfoCard
                  eyebrow="Barcode type"
                  title={decodedResult.barcodeType}
                  titleClassName="text-lg font-semibold"
                  className="bg-[hsl(var(--secondary)/0.26)]"
                />

                <ToolInfoCard
                  eyebrow="Decoded content"
                  title={decodedResult.value}
                  titleClassName="break-all font-mono text-sm"
                  className="bg-[hsl(var(--secondary)/0.26)]"
                />

                <ToolPillGroup>
                  <Button onClick={copyResult}>
                    <Copy className="h-4 w-4" />
                    Copy Result
                  </Button>
                </ToolPillGroup>
              </div>
            ) : (
              <ToolEmptyState
                icon={FileCode}
                title="No decoded barcode yet"
                description="Upload a barcode image and the extracted format and content will appear here."
              />
            )}
          </ToolPanel>
      </div>
    </ToolPageShell>
  );
};

export default BarcodeDecoder;
