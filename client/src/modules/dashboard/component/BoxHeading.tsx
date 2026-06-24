import { cn } from "@/utils/tailwindcss-merger";
import React from "react";

const BoxHeading = ({
  heading,
  para,
  sectionClassName,
  headingClassName,
  paraClassName,
}: {
  heading: string;
  para: string;
  sectionClassName?: string;
  headingClassName?: string;
  paraClassName?: string;
}) => {
  return (
    <section className={cn("mb-4 space-y-1", sectionClassName)}>
      <h2 className={cn("text-base sm:text-xl font-medium", headingClassName)}>{heading}</h2>
      <p className={cn("text-xs sm:text-sm text-[hsl(var(--muted-foreground)/0.8)]", paraClassName)}>
        {para}
      </p>
    </section>
  );
};

export default BoxHeading;
