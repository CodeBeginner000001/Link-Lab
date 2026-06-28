const columns = [
  { label: "Name", className: "" },
  { label: "Total Rows", className: "text-center" },
  { label: "Success", className: "text-center" },
  { label: "Fails", className: "text-center" },
  { label: "Created", className: "text-center" },
  { label: "Actions", className: "text-center" },
];

export default function BulkBarcodeUploadsHeader() {
  return (
    <div className="hidden gap-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.32)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))] lg:grid lg:grid-cols-[minmax(180px,1.3fr)_100px_100px_80px_130px_230px] lg:items-center">
      {columns.map((column) => (
        <span key={column.label} className={column.className}>
          {column.label}
        </span>
      ))}
    </div>
  );
}
