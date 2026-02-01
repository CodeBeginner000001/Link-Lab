import { LucideIcon } from "lucide-react";

type HeaderProp = {
    icon: LucideIcon;
    heading: string;
    paraline1: string;
    paraline2: string;
}
export default function OTPHeader({
  icon: Icon,
  heading,
  paraline1,
  paraline2,
}: HeaderProp) {
  return (
    <div className="text-center mb-8">
      <div className="w-16 h-16 rounded-full bg-[hsl(var(--primary)/0.1)] flex items-center justify-center mx-auto mb-6">
        <Icon className="w-8 h-8 text-[hsl(var(--primary))]" />
      </div>

      <h1 className="text-2xl font-bold mb-2">{heading}</h1>

      <p className="text-[hsl(var(--muted-foreground)/0.9)]">{paraline1}</p>

      <p className="text-[hsl(var(--foreground))] font-medium mt-1">
        {paraline2}
      </p>
    </div>
  );
}
