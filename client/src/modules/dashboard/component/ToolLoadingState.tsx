import { cn } from "@/utils/tailwindcss-merger";
import { Loader2, LucideIcon } from "lucide-react";

type ToolLoadingStateProps = {
  title: string;
  description: string;
  icon?: LucideIcon;
  className?: string;
};

export default function ToolLoadingState({
  title,
  description,
  icon: Icon = Loader2,
  className,
}: ToolLoadingStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[320px] flex-col items-center justify-center text-center",
        className,
      )}
    >
      <Icon className="h-12 w-12 animate-spin text-primary" />
      <p className="mt-4 text-lg font-semibold">{title}</p>
      <p className="mt-2 text-sm text-[hsl(var(--muted-foreground)/0.84)]">
        {description}
      </p>
    </div>
  );
}
