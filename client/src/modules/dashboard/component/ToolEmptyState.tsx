import { cn } from "@/utils/tailwindcss-merger";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

type ToolEmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
  children?: ReactNode;
};

export default function ToolEmptyState({
  icon: Icon,
  title,
  description,
  className,
  children,
}: ToolEmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[280px] flex-col items-center justify-center rounded-2xl border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.28)] px-6 py-10 text-center",
        className,
      )}
    >
      <div className="mb-4 rounded-2xl bg-[hsl(var(--background))] p-4 shadow-sm">
        <Icon className="h-6 w-6 sm:h-10 sm:w-10 text-[hsl(var(--muted-foreground)/0.75)]" />
      </div>
      <h3 className="text-base sm:text-lg font-semibold">{title}</h3>
      <p className="mt-2 max-w-sm text-xs sm:text-sm text-[hsl(var(--muted-foreground)/0.85)]">
        {description}
      </p>
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}
