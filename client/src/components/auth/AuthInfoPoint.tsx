export default function AuthInfoPoint({ text }: { text: string }) {
  return (
    <li className="flex items-start gap-3">
      <div className="w-6 h-6 rounded-full bg-[hsl(var(--primary)/0.2)] flex items-center justify-center shrink-0 mt-0.5">
        <span className="text-[hsl(var(--primary))] text-xs font-bold">✓</span>
      </div>
      <span>{text}</span>
    </li>
  );
}
