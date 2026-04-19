"use client";

import { cn } from "@/utils/tailwindcss-merger";
import { useEffect, useRef } from "react";

type QRPatternOptionProps = {
  label: string;
  isSelected: boolean;
  onClick: () => void;
  draw: (context: CanvasRenderingContext2D, size: number) => void;
};

export default function QRPatternOption({
  label,
  isSelected,
  onClick,
  draw,
}: QRPatternOptionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");

    if (!canvas || !context) {
      return;
    }

    canvas.width = 40;
    canvas.height = 40;
    context.clearRect(0, 0, 40, 40);
    draw(context, 40);
  }, [draw]);

  return (
    <button
      type="button"
      onClick={onClick}
      title={label}
      className={cn(
        "relative flex flex-col items-center gap-1 rounded-xl border-2 p-1.5 transition-all duration-200 hover:scale-[1.03]",
        isSelected
          ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.08)] shadow-sm"
          : "border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:border-[hsl(var(--primary)/0.4)]",
      )}
    >
      <canvas ref={canvasRef} width={40} height={40} className="h-8 w-8" />
      <span className="text-[9px] font-medium leading-none text-[hsl(var(--muted-foreground))]">
        {label}
      </span>
      {isSelected ? (
        <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-[hsl(var(--background))] bg-[hsl(var(--primary))]" />
      ) : null}
    </button>
  );
}
