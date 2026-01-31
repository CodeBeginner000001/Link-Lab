import Link from "next/link";


export default function AuthFooter({href, buttonLabel, headline}: {
    href: string,
    buttonLabel: string,
    headline: string,
}) {
  return (
    <p className="text-center text-sm text-[hsl(var(--muted-foreground)/0.9)] mt-6">
      {headline}{" "}
      <Link href={href}>
        <button className="text-[hsl(var(--primary))] hover:underline font-medium">
         {buttonLabel}
        </button>
      </Link>
    </p>
  );
}
