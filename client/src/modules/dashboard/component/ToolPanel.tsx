import { cn } from "@/utils/tailwindcss-merger";
import { ReactNode } from "react";
import BoxHeading from "./BoxHeading";

type ToolPanelProps = {
  heading: string;
  para: string;
  headerSlot?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  headerClassName?: string;
};

export default function ToolPanel({
  heading,
  para,
  headerSlot,
  children,
  className,
  bodyClassName,
  headerClassName,
}: ToolPanelProps) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3 shadow-sm sm:p-6",
        className,
      )}
    >
      <div
        className={cn(
          "flex flex-col gap-4 border-b border-[hsl(var(--border)/0.7)] pb-4 sm:flex-row sm:items-start sm:justify-between",
          headerClassName,
        )}
      >
        <BoxHeading
          heading={heading}
          para={para}
          sectionClassName="mb-0"
          paraClassName="max-w-2xl"
        />
        {headerSlot ? <div className="shrink-0">{headerSlot}</div> : null}
      </div>

      <div className={cn("pt-5", bodyClassName)}>
        {children}
      </div>
    </section>
  );
}
