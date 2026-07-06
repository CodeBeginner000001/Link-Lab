import { SchemaAnalyticsDistributionSection } from ".";
import { getValueByPath } from "../schema-driven/utils";


const DEFAULT_COLORS = [
  "bg-cyan-500",
  "bg-indigo-500",
  "bg-violet-500",
  "bg-emerald-500",
  "bg-amber-500",
];

type SchemaDistributionSectionProps = {
  section: SchemaAnalyticsDistributionSection;
  data?: Record<string, unknown>;
};

const toNumber = (value: unknown) => Number(value ?? 0) || 0;

export default function SchemaDistributionSection({
  section,
  data,
}: SchemaDistributionSectionProps) {
  const values = getValueByPath(data, section.valuePath);
  const items = Array.isArray(values) ? values : [];
  const labelPath = section.labelPath ?? "format";
  const countPath = section.countPath ?? "count";
  const percentagePath = section.percentagePath ?? "percentage";
  const total = items.reduce(
    (sum, item) => sum + toNumber(getValueByPath(item, countPath)),
    0,
  );

  return (
    <div className="min-w-0 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.18)] p-4 max-[540px]:rounded-xl max-[540px]:p-3 sm:p-5">
      <div className="flex min-w-0 items-center justify-between gap-3 min-[288px]:items-start">
        <div className="min-w-0">
          <p className="text-sm font-semibold">{section.title}</p>
          {section.description ? (
            <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))] max-[288px]:hidden">
              {section.description}
            </p>
          ) : null}
        </div>
        <span className="text-nowrap rounded-full bg-[hsl(var(--primary)/0.12)] px-2.5 py-1 text-xs font-semibold text-[hsl(var(--primary))]">
          {section.badgeLabel ?? `${items.length} formats`}
        </span>
      </div>

      {items.length > 0 ? (
        <div className="mt-7 space-y-5">
          {items.map((item, index) => {
            const label = String(getValueByPath(item, labelPath) ?? "-");
            const count = toNumber(getValueByPath(item, countPath));
            const percentage =
              getValueByPath(item, percentagePath) === undefined
                ? total > 0
                  ? Math.round((count / total) * 100)
                  : 0
                : toNumber(getValueByPath(item, percentagePath));

            return (
              <div key={`${label}-${index}`}>
                <div className="mb-2 flex min-w-0 items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate font-medium">{label}</span>
                  <span className="shrink-0 text-[hsl(var(--muted-foreground))]">
                    {percentage}% · {count}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[hsl(var(--muted))]">
                  <div
                    className={`h-full rounded-full ${
                      DEFAULT_COLORS[index % DEFAULT_COLORS.length]
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-7 text-sm text-[hsl(var(--muted-foreground))]">
          {section.emptyText ?? "Create an item to see distribution."}
        </p>
      )}

      {section.secondary ? (
        <SecondaryDistribution section={section.secondary} data={data} />
      ) : null}
    </div>
  );
}

function SecondaryDistribution({
  section,
  data,
}: {
  section: NonNullable<SchemaAnalyticsDistributionSection["secondary"]>;
  data?: Record<string, unknown>;
}) {
  const segments = section.segments.map((segment) => ({
    ...segment,
    value: toNumber(getValueByPath(data, segment.valuePath)),
  }));
  const total = segments.reduce((sum, segment) => sum + segment.value, 0);

  return (
    <div className="mt-7 min-w-0 rounded-xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-4 max-[540px]:mt-5 max-[540px]:p-3">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <p className="text-sm font-medium">{section.title}</p>
        <p className="shrink-0 text-sm font-semibold">
          {section.totalLabel ?? "Total"} {total}
        </p>
      </div>
      <div className="mt-3 flex h-2 overflow-hidden rounded-full bg-[hsl(var(--muted))]">
        {segments.map((segment, index) => (
          <div
            key={segment.label}
            className={
              segment.className ??
              (index === 0 ? "bg-[hsl(var(--primary))]" : "bg-indigo-500")
            }
            style={{
              width:
                total > 0 ? `${Math.max((segment.value / total) * 100, 0)}%` : "0%",
              flex: total > 0 ? "none" : index === 0 ? "0 0 0%" : "1 1 0%",
            }}
          />
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 text-xs text-[hsl(var(--muted-foreground))]">
        {segments.map((segment) => (
          <span key={segment.label}>
            {segment.label} {segment.value}
          </span>
        ))}
      </div>
    </div>
  );
}
