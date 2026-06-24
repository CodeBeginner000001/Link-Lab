import Logo from "@/components/Logo";
import { Button } from "@/components/ui/Button";
import { AlertTriangle, ArrowLeft, Home, Link2Off } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

type ErrorStatePageProps = {
  code: "404" | "410" | "500";
  title: string;
  description: string;
  primaryHref?: string;
  primaryLabel?: string;
  secondaryHref?: string;
  secondaryLabel?: string;
  actions?: ReactNode;
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
  actions,
}: ErrorStatePageProps) {
  const Icon = iconByCode[code];

  return (
    <main className="min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))]">
      <header className="mx-auto w-full max-w-350 px-4 ">
        <div className="flex h-14 items-center sm:h-16">
          <Link href="/" className="w-fit">
            <Logo size="sm" />
          </Link>
        </div>
      </header>

      <section className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="w-full max-w-2xl flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] shadow-[var(--shadow-card)] sm:mb-5 sm:h-14 sm:w-14 lg:h-16 lg:w-16">
            <Icon className="h-6 w-6 text-[hsl(var(--primary))] sm:h-7 sm:w-7 lg:h-8 lg:w-8" />
          </div>

          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[hsl(var(--primary))] sm:mb-3 sm:text-sm">
            Error {code}
          </p>

          <h1 className="text-3xl font-bold tracking-normal sm:text-5xl">
            {title}
          </h1>

          <p className="mt-3 max-w-xl text-sm leading-6 text-[hsl(var(--muted-foreground))] sm:mt-4 sm:text-lg sm:leading-7">
            {description}
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap">
            <Button asChild size="lg" className="h-11 w-full sm:h-12 sm:w-auto">
              <Link href={primaryHref}>
                <Home className="h-4 w-4" />
                {primaryLabel}
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-11 w-full sm:h-12 sm:w-auto"
            >
              <Link href={secondaryHref}>{secondaryLabel}</Link>
            </Button>

            {actions}
          </div>
        </div>
      </section>
    </main>
  );
}
