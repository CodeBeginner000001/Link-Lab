import { cn } from "@/utils/tailwindcss-merger";
import { ReactNode } from "react";

type ToolInfoCardProps = {
  eyebrow?: string;
  title?: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  className?: string;
  eyebrowClassName?: string;
  titleClassName?: string;
  descriptionClassName?: string;
  contentClassName?: string;
};

export default function ToolInfoCard({
  eyebrow,
  title,
  description,
  children,
  className,
  eyebrowClassName,
  titleClassName,
  descriptionClassName,
  contentClassName,
}: ToolInfoCardProps) {
  const hasHeader = eyebrow || title || description;

  return (
    <div
      className={cn(
        "rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.24)] p-4",
        className,
      )}
    >
      {eyebrow ? (
        <p
          className={cn(
            "text-xs uppercase tracking-[0.18em] text-[hsl(var(--muted-foreground)/0.72)]",
            eyebrowClassName,
          )}
        >
          {eyebrow}
        </p>
      ) : null}

      {title ? (
        <div
          className={cn(
            eyebrow ? "mt-2" : "",
            "text-sm font-semibold",
            titleClassName,
          )}
        >
          {title}
        </div>
      ) : null}

      {description ? (
        <div
          className={cn(
            eyebrow || title ? "mt-2" : "",
            "text-sm text-[hsl(var(--muted-foreground)/0.88)]",
            descriptionClassName,
          )}
        >
          {description}
        </div>
      ) : null}

      {children ? (
        <div className={cn(hasHeader ? "mt-3" : "", contentClassName)}>
          {children}
        </div>
      ) : null}
    </div>
  );
}
