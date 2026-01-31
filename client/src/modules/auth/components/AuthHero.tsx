import Logo from "@/components/Logo";
import { LogoSize } from "@/interfaces/components";

export default function AuthHero({
  logoSize = "lg",
  heading,
  headline,
}: {
  logoSize?: LogoSize;
  heading: string;
  headline: string;
}) {
  return (
    <div className="text-center mb-8">
      <div className="flex justify-center mb-6">
        <Logo size={logoSize} />
      </div>
      <h1 className="font-bold text-2xl mb-2">{heading}</h1>
      <p className="text-[hsl(var(--muted-foreground)/0.9)]">
        {headline}
      </p>
    </div>
  );
}
