import { cn } from "@/utils/tailwindcss-merger";
import { ReactNode } from "react";

type ToolPreviewFrameProps = {
  children: ReactNode;
  className?: string;
  innerClassName?: string;
};

export default function ToolPreviewFrame({
  children,
  className,
  innerClassName,
}: ToolPreviewFrameProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.22)] p-4 sm:p-6",
        className,
      )}
    >
      <div
        className={cn(
          "mx-auto flex w-full items-center justify-center rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-4 shadow-sm",
          innerClassName,
        )}
      >
        {children}
      </div>
    </div>
  );
}
