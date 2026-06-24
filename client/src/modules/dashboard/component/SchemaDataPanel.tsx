import { Button } from "@/components/ui/Button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import ToolEmptyState from "../component/ToolEmptyState";
import ToolFeaturePill from "../component/ToolFeaturePill";
import ToolPanel from "../component/ToolPanel";
import ToolPillGroup from "../component/ToolPillGroup";
import type {
  SchemaDataPanel as SchemaDataPanelConfig,
  SchemaPaginationState,
} from "../schema-driven/types";
import { toDisplayValue, getValueByPath } from "../schema-driven/utils";


type SchemaDataPanelProps<TItem extends Record<string, unknown>> = {
  schema: SchemaDataPanelConfig<TItem>;
  items: TItem[];
  pagination?: SchemaPaginationState;
  paginationBasePath?: string;
  descriptionSlot?: string;
  panelHeaderSlot?: React.ReactNode;
  headerSlot?: React.ReactNode;
  contentSlot?: React.ReactNode;
  rowSlot?: (item: TItem) => React.ReactNode;
};

export default function SchemaDataPanel<TItem extends Record<string, unknown>>({
  schema,
  items,
  pagination,
  paginationBasePath,
  descriptionSlot,
  panelHeaderSlot,
  headerSlot,
  contentSlot,
  rowSlot,
}: SchemaDataPanelProps<TItem>) {
  return (
    <ToolPanel
      heading={schema.title}
      para={descriptionSlot ?? schema.description}
      headerSlot={panelHeaderSlot}
    >
      {schema.chips?.length ? (
        <ToolPillGroup className="mb-5">
          {schema.chips.map((chip) => (
            <ToolFeaturePill
              key={chip.label}
              icon={chip.icon}
              label={chip.label}
            />
          ))}
        </ToolPillGroup>
      ) : null}

      {contentSlot ? (
        contentSlot
      ) : !items.length && schema.emptyState ? (
        <ToolEmptyState
          icon={schema.emptyState.icon}
          title={schema.emptyState.title}
          description={schema.emptyState.description}
        />
      ) : (
        <div className="overflow-hidden rounded-xl border border-[hsl(var(--border))]">
          {headerSlot ?? (
            <div
              className="grid gap-3 border-b border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.32)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))]"
              style={{
                gridTemplateColumns: `repeat(${schema.columns.length}, minmax(0, 1fr))`,
              }}
            >
              {schema.columns.map((column) => (
                <span key={column.key} className={column.className}>
                  {column.label}
                </span>
              ))}
            </div>
          )}

          <div className="divide-y divide-[hsl(var(--border))]">
            {items.map((item, index) =>
              rowSlot ? (
                <div key={String(item.id ?? index)}>{rowSlot(item)}</div>
              ) : (
                <div
                  key={String(item.id ?? index)}
                  className="grid gap-3 px-4 py-3 text-sm"
                  style={{
                    gridTemplateColumns: `repeat(${schema.columns.length}, minmax(0, 1fr))`,
                  }}
                >
                  {schema.columns.map((column) => (
                    <span key={column.key} className={column.className}>
                      {toDisplayValue(getValueByPath(item, column.key))}
                    </span>
                  ))}
                </div>
              ),
            )}
          </div>

          {schema.pagination?.enabled && pagination && paginationBasePath ? (
            <SchemaPaginationFooter
              pagination={pagination}
              pageParam={schema.pagination.pageParam ?? "page"}
              limitParam={schema.pagination.limitParam ?? "limit"}
              itemLabel={schema.pagination.itemLabel ?? "items"}
              basePath={paginationBasePath}
            />
          ) : null}
        </div>
      )}
    </ToolPanel>
  );
}

function SchemaPaginationFooter({
  pagination,
  pageParam,
  limitParam,
  itemLabel,
  basePath,
}: {
  pagination: SchemaPaginationState;
  pageParam: string;
  limitParam: string;
  itemLabel: string;
  basePath: string;
}) {
  if (pagination.totalPages <= 1) {
    return null;
  }

  const getHref = (page: number) => {
    const params = new URLSearchParams();
    params.set(pageParam, String(page));
    params.set(limitParam, String(pagination.limit));

    return `${basePath}?${params.toString()}`;
  };

  return (
    <div className="flex flex-col gap-3 border-t border-[hsl(var(--border))] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs text-[hsl(var(--muted-foreground))]">
        Page {pagination.page} of {pagination.totalPages} · {pagination.total}{" "}
        {itemLabel}
      </p>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pagination.page <= 1}
          asChild={pagination.page > 1}
        >
          {pagination.page > 1 ? (
            <Link href={getHref(pagination.page - 1)}>
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Link>
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              Previous
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pagination.page >= pagination.totalPages}
          asChild={pagination.page < pagination.totalPages}
        >
          {pagination.page < pagination.totalPages ? (
            <Link href={getHref(pagination.page + 1)}>
              Next
              <ChevronRight className="h-4 w-4" />
            </Link>
          ) : (
            <>
              Next
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
