import { LogoProps } from "@/src/interfaces/components";
import { Link2 } from "lucide-react";
export default function Logo({ showText = true }: LogoProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-[hsl(var(--primary))] rounded-xl flex items-center justify-center shadow-lg logo-glow">
        <Link2 className="text-[hsl(var(--primary-foreground))]" size={16} />
      </div>

      {showText && (
        <span className="text-lg font-bold tracking-tighter">
          <span className="gradient-text">Link</span>
          <span className="text-foreground">Lab</span>
        </span>
      )}
    </div>
  );
}
