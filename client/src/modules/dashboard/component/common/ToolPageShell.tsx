import MotionWrapper from "@/components/common/MotionWrapper";
import { cn } from "@/utils/tailwindcss-merger";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";
import Heading from "./Heading";

type ToolPageShellProps = {
  icon: LucideIcon;
  heading: string;
  para: string;
  children: ReactNode;
  className?: string;
  headingClassName?: string;
  iconClassName?: string;
  paraClassName?: string;
};

export default function ToolPageShell({
  icon,
  heading,
  para,
  children,
  className,
  headingClassName,
  iconClassName,
  paraClassName,
}: ToolPageShellProps) {
  return (
    <MotionWrapper>
      <div className={cn("space-y-6", className)}>
        <Heading
          icon={icon}
          heading={heading}
          para={para}
          headingClassName={headingClassName}
          iconClassName={iconClassName}
          paraClassName={paraClassName}
        />
        {children}
      </div>
    </MotionWrapper>
  );
}
