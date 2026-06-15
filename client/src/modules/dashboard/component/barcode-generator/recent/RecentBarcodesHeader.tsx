export default function RecentBarcodesHeader() {
  return (
    <div className="hidden grid-cols-[minmax(240px,1.4fr)_120px_170px_110px_80px] gap-4 border-b border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.28)] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[hsl(var(--muted-foreground))] md:grid">
      <span>Barcode</span>
      <span>Format</span>
      <span>Created</span>
      <span>Downloads</span>
      <span>Actions</span>
    </div>
  );
}
