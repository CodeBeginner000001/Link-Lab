import Logo from "@/components/Logo";
import { Button } from "@/components/ui/Button";
import { AlertTriangle, ArrowLeft, Home, Link2Off } from "lucide-react";
import Link from "next/link";

type ErrorStatePageProps = {
  code: "404" | "410" | "500";
  title: string;
  description: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
};

const iconByCode = {
  "404": Link2Off,
  "410": ArrowLeft,
  "500": AlertTriangle,
};

export default function ErrorStatePage({
  code,
  title,
  description,
  primaryHref = "/",
  primaryLabel = "Go home",
  secondaryHref = "/dashboard",
  secondaryLabel = "Open dashboard",
}: ErrorStatePageProps) {
  const Icon = iconByCode[code];

  return (
    <main className="min-h-screen bg-[hsl(var(--background))] px-4 py-8 text-[hsl(var(--foreground))]">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-4xl flex-col">
        <Link href="/" className="w-fit">
          <Logo size="sm" />
        </Link>

        <section className="flex flex-1 items-center justify-center py-12">
          <div className="w-full max-w-2xl text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-[var(--shadow-card)]">
              <Icon className="h-8 w-8 text-[hsl(var(--primary))]" />
            </div>

            <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-[hsl(var(--primary))]">
              Error {code}
            </p>
            <h1 className="text-4xl font-bold tracking-normal text-[hsl(var(--foreground))] sm:text-5xl">
              {title}
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-[hsl(var(--muted-foreground))] sm:text-lg">
              {description}
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href={primaryHref}>
                  <Home className="h-4 w-4" />
                  {primaryLabel}
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="w-full sm:w-auto"
              >
                <Link href={secondaryHref}>{secondaryLabel}</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
