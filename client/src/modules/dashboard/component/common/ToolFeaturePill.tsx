import { cn } from "@/utils/tailwindcss-merger";
import { LucideIcon } from "lucide-react";

type ToolFeaturePillProps = {
  label: string;
  icon?: LucideIcon;
  className?: string;
};

export default function ToolFeaturePill({
  label,
  icon: Icon,
  className,
}: ToolFeaturePillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 cursor-default rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.45)] px-3 py-1.5 text-[10px] sm:text-xs font-medium text-[hsl(var(--muted-foreground))]",
        className,
      )}
    >
      {Icon ? <Icon className="h-3.5 w-3.5 text-[hsl(var(--foreground))]" /> : null}
      {label}
    </span>
  );
}
