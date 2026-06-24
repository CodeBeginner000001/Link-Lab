import { cn } from "@/utils/tailwindcss-merger";

type ToolSegmentedTabsProps = {
  options: Array<{
    label: string;
    value: string;
  }>;
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
};

export default function ToolSegmentedTabs({
  options,
  value,
  onValueChange,
  className,
}: ToolSegmentedTabsProps) {
  return (
    <div
      role="tablist"
      className={cn(
        "flex flex-wrap gap-2 rounded-2xl bg-[hsl(var(--secondary)/0.55)] p-1",
        className,
      )}
    >
      {options.map((option) => {
        const isActive = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onValueChange(option.value)}
            className={cn(
              "min-w-[96px] flex-1 rounded-xl px-4 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-[hsl(var(--background))] text-[hsl(var(--foreground))] shadow-sm"
                : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
