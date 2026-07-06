import { cn } from "@/utils/tailwindcss-merger";
import { ReactNode } from "react";

type ToolMetricCardProps = {
  label: string;
  value: ReactNode;
  className?: string;
  labelClassName?: string;
  valueClassName?: string;
};

export default function ToolMetricCard({
  label,
  value,
  className,
  labelClassName,
  valueClassName,
}: ToolMetricCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-4",
        className,
      )}
    >
      <p
        className={cn(
          "text-xs uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground)/0.72)]",
          labelClassName,
        )}
      >
        {label}
      </p>
      <div className={cn("mt-2 text-sm font-semibold", valueClassName)}>
        {value}
      </div>
    </div>
  );
}
