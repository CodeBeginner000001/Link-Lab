import { LogoProps, sizeClassesProps, textSizeClassesProps } from "@/src/interfaces/components";
import { Link2 } from "lucide-react";
export default function Logo({ size= "md",showText = true }: LogoProps) {
  const sizeClasses: sizeClassesProps = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-14 h-14",
  };

  const textSizeClasses: textSizeClassesProps = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-3xl",
  };
  return (
    <div className="flex items-center gap-2">
      <div className={`${sizeClasses[size]} w-8 h-8 bg-[hsl(var(--primary))] rounded-xl flex items-center justify-center shadow-lg logo-glow`}>
        <Link2 className="text-[hsl(var(--primary-foreground))]" size={size === "lg" ? 28 : size === "md" ? 22 : 16}/>
      </div>

      {showText && (
        <span className={`${textSizeClasses[size]} font-bold tracking-tight`}>
          <span className="gradient-text">Link</span>
          <span className="text-foreground">Lab</span>
        </span>
      )}
    </div>
  );
}
