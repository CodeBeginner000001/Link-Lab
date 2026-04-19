"use client";

import { QRStyleDraft } from "@/modules/dashboard/interface/qrGeneratorStyle";
import { QrCodeStyle } from "@/service/dashboard/qr-generator/type";
import { cn } from "@/utils/tailwindcss-merger";
import { useEffect, useRef } from "react";
import { drawStyledQrPreview } from "./qr-preview-renderer";

type QRCanvasPreviewProps = {
  content: string;
  style: QRStyleDraft | QrCodeStyle;
  size?: number;
  className?: string;
};

export default function QRCanvasPreview({
  content,
  style,
  size = 320,
  className,
}: QRCanvasPreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    drawStyledQrPreview(canvas, content, style);
  }, [content, style]);

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      className={cn("h-auto w-full rounded-2xl", className)}
    />
  );
}
