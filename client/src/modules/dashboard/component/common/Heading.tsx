import { cn } from "@/utils/tailwindcss-merger";
import { LucideIcon } from "lucide-react";

interface HeadingProps {
  icon?: LucideIcon;
  heading: string;
  para: string;
  icon1?: LucideIcon;
  containerClassName?: string;
  headingClassName?: string;
  iconClassName?: string;
  paraClassName?: string;
  secondIconClassName?: string;
}

const Heading = ({
  icon: Icon,
  heading,
  para,
  icon1: Icon1,
  containerClassName,
  headingClassName,
  iconClassName,
  paraClassName,
  secondIconClassName,
}: HeadingProps) => {
  return (
    <section className={cn("space-y-1", containerClassName)}>
      <h1
        className={cn(
          "text-2xl font-bold flex items-center gap-2",
          headingClassName
        )}
      >
        {Icon && (
          <Icon
            className={cn(
              "w-8 h-8 text-primary",
              iconClassName
            )}
          />
        )}
        {heading}
      </h1>

      <p
        className={cn(
          "text-[hsl(var(--muted-foreground)/0.8)]",
          paraClassName
        )}
      >
        {para}
      </p>

      {Icon1 && (
        <Icon1
          className={cn(
            "h-8 w-8 text-primary",
            secondIconClassName
          )}
        />
      )}
    </section>
  );
};

export default Heading;
