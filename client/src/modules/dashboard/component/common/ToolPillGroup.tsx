import { cn } from "@/utils/tailwindcss-merger";
import { ReactNode } from "react";

type ToolPillGroupProps = {
  children: ReactNode;
  className?: string;
};

export default function ToolPillGroup({
  children,
  className,
}: ToolPillGroupProps) {
  return <div className={cn("flex flex-wrap gap-2", className)}>{children}</div>;
}
