import { cn } from "@/utils/tailwindcss-merger";
import { ReactNode } from "react";

type ToolTableWrapperProps = {
  header: ReactNode;
  children: ReactNode;
  className?: string;
  headerClassName?: string;
  bodyClassName?: string;
};

export default function ToolTableWrapper({
  header,
  children,
  className,
  headerClassName,
  bodyClassName,
}: ToolTableWrapperProps) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-[1.75rem] border border-[hsl(var(--border))] bg-[hsl(var(--card))]",
        className,
      )}
    >
      <div className={cn("border-b border-[hsl(var(--border))]", headerClassName)}>
        {header}
      </div>
      <div className={bodyClassName}>{children}</div>
    </div>
  );
}
