import type {
    FeaturePanelSlots,
    FeatureToolSchema,
    SchemaForm as SchemaFormConfig,
    SchemaPaginationState,
} from "../schema-driven/types";
import SchemaAnalyticsPanel from "./SchemaAnalyticsPanel";
import SchemaAutoRefresh from "./SchemaAutoRefresh";
import SchemaDataPanel from "./SchemaDataPanel";
import SchemaForm from "./SchemaForm";
import SchemaPanel from "./SchemaPanel";
import ToolPageShell from "./ToolPageShell";

type SchemaToolPageProps<
  TFormValues extends Record<string, unknown>,
  TListItem extends Record<string, unknown>,
  TAnalytics extends Record<string, unknown> = Record<string, unknown>,
> = {
  schema: FeatureToolSchema<TFormValues, TListItem, TAnalytics>;
  items?: TListItem[];
  analytics?: TAnalytics;
  pagination?: SchemaPaginationState;
  slots?: FeaturePanelSlots<TListItem>;
};

export default function SchemaToolPage<
  TFormValues extends Record<string, unknown>,
  TListItem extends Record<string, unknown>,
  TAnalytics extends Record<string, unknown> = Record<string, unknown>,
>({
  schema,
  items = [],
  analytics,
  pagination,
  slots,
}: SchemaToolPageProps<TFormValues, TListItem, TAnalytics>) {
  const SubmitIcon = schema.panels.form.submit.icon;
  const submitIcon = SubmitIcon ? (
    <SubmitIcon className="h-4 w-4" />
  ) : undefined;
  const { api, fields, submit, title, description, successEvent } =
    schema.panels.form;
  const formSchema: SchemaFormConfig<Record<string, unknown>> = {
    api,
    fields,
    title,
    description,
    successEvent,
    submit: {
      label: submit.label,
      loadingLabel: submit.loadingLabel,
    },
  };

  return (
    <ToolPageShell
      icon={schema.header.icon}
      heading={schema.header.title}
      para={schema.header.description}
      headingClassName="text-xl max-[350px]:text-lg sm:text-2xl"
      iconClassName="h-6 w-6 shrink-0 text-[hsl(var(--primary))] max-[350px]:h-5 max-[350px]:w-5"
      paraClassName="text-sm max-[350px]:text-xs max-[350px]:leading-5 sm:text-base"
    >
      <SchemaAutoRefresh intervalMs={10000} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <SchemaPanel
          title={schema.panels.form.title}
          description={schema.panels.form.description}
          responsiveChip={schema.panels.form.responsiveChip}
          chips={schema.panels.form.chips}
        >
          <SchemaForm schema={formSchema} submitIcon={submitIcon} />
        </SchemaPanel>

        <SchemaPanel
          title={schema.panels.secondary.title}
          description={schema.panels.secondary.description}
          chips={schema.panels.secondary.chips}
        >
          {slots?.secondary}
        </SchemaPanel>
      </div>

      <SchemaAnalyticsPanel
        schema={schema.panels.analytics}
        data={analytics}
        activitySlot={slots?.activity}
      />

      <SchemaDataPanel
        schema={schema.panels.data}
        items={items}
        pagination={pagination}
        paginationBasePath={`/dashboard/${schema.slug}`}
        descriptionSlot={slots?.dataPanelDescription}
        panelHeaderSlot={slots?.dataPanelHeader}
        headerSlot={slots?.dataHeader}
        contentSlot={slots?.dataContent}
        rowSlot={slots?.row}
      />
    </ToolPageShell>
  );
}
