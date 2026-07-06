import { cn } from "@/utils/tailwindcss-merger";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";

type ToolUploadZoneProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  hint?: string;
  preview?: ReactNode;
  onClick?: () => void;
  className?: string;
  disabled?: boolean;
};

export default function ToolUploadZone({
  icon: Icon,
  title,
  description,
  hint,
  preview,
  onClick,
  className,
  disabled = false,
}: ToolUploadZoneProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex min-h-[264px] w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.24)] px-6 py-8 text-center transition-colors hover:border-[hsl(var(--primary)/0.45)] hover:bg-[hsl(var(--secondary)/0.36)] disabled:cursor-not-allowed disabled:hover:border-[hsl(var(--border))] disabled:hover:bg-[hsl(var(--secondary)/0.24)]",
        className,
      )}
    >
      {preview ? (
        preview
      ) : (
        <>
          <div className="mb-4 rounded-2xl bg-[hsl(var(--background))] p-4 shadow-sm">
            <Icon className="h-10 w-10 text-[hsl(var(--muted-foreground)/0.8)]" />
          </div>
          <p className="text-base font-semibold">{title}</p>
          <p className="mt-2 max-w-sm text-sm text-[hsl(var(--muted-foreground)/0.85)]">
            {description}
          </p>
          {hint ? (
            <p className="mt-3 text-xs uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground)/0.72)]">
              {hint}
            </p>
          ) : null}
        </>
      )}
    </button>
  );
}
