"use client";

import ToolFeaturePill from "../component/ToolFeaturePill";
import ToolMetricCard from "../component/ToolMetricCard";
import ToolPanel from "../component/ToolPanel";
import ToolPillGroup from "../component/ToolPillGroup";
import { toDisplayValue, getValueByPath } from "../schema-driven/utils";
import SchemaActivitySection from "./SchemaActivitySection";
import SchemaDistributionSection from "./SchemaDistributionSection";
import type { SchemaAnalyticsPanel as SchemaAnalyticsPanelConfig } from "../schema-driven/types";

type SchemaAnalyticsPanelProps = {
  schema: SchemaAnalyticsPanelConfig;
  data?: Record<string, unknown>;
  activitySlot?: React.ReactNode;
};

export default function SchemaAnalyticsPanel({
  schema,
  data,
  activitySlot,
}: SchemaAnalyticsPanelProps) {
  return (
    <ToolPanel heading={schema.title} para={schema.description}>
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

      {schema.cards?.length ? (
        <div className="grid gap-3 sm:grid-cols-3">
          {schema.cards.map((card) => {
            const Icon = card.icon;
            return (
              <ToolMetricCard
                key={card.label}
                label={card.label}
                value={
                  <span className="inline-flex items-center gap-2">
                    {Icon ? <Icon className="h-4 w-4" /> : null}
                    {toDisplayValue(
                      getValueByPath(data, card.valuePath),
                      card.fallback ? String(card.fallback) : "-",
                    )}
                  </span>
                }
              />
            );
          })}
        </div>
      ) : null}

      {activitySlot ? (
        <div className="mt-5">
          {schema.activityTitle ? (
            <p className="mb-3 text-sm font-semibold">{schema.activityTitle}</p>
          ) : null}
          {activitySlot}
        </div>
      ) : null}

      {schema.sections?.length ? (
        <div className="mt-5 grid gap-5 max-[540px]:gap-3 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
          {schema.sections.map((section, index) =>
            section.type === "activity" ? (
              <SchemaActivitySection
                key={`${section.type}-${index}`}
                section={section}
              />
            ) : (
              <SchemaDistributionSection
                key={`${section.type}-${index}`}
                section={section}
                data={data}
              />
            ),
          )}
        </div>
      ) : null}
    </ToolPanel>
  );
}
