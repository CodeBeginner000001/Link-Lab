export default function AuthDivider({ dividerLine }: { dividerLine: string }) {
  return (
    <div className="relative mb-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-[hsl(var(--border))]" />
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="px-2 bg-[hsl(var(--background))] text-[hsl(var(--muted-foreground)/0.9)]">
          {dividerLine}
        </span>
      </div>
    </div>
  );
}
