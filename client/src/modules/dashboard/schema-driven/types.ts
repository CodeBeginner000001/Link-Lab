import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export type SchemaHttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type SchemaApiEndpoint = {
  path: string;
  method?: SchemaHttpMethod;
  useProxy?: boolean;
  responsePath?: string;
  cacheTags?: string[];
};

export type SchemaChip = {
  label: string;
  icon?: LucideIcon;
};

export type SchemaButton = {
  label: string;
  loadingLabel?: string;
  icon?: LucideIcon;
};

export type SchemaFieldValidation = {
  pattern?: string;
  message?: string;
  min?: number;
  max?: number;
  step?: number;
  minLength?: number;
  maxLength?: number;
};

type BaseField<TName extends string> = {
  name: TName;
  label: string;
  placeholder?: string;
  description?: string;
  required?: boolean;
  defaultValue?: string | number | boolean;
  visibleWhen?: {
    field: string;
    equals: string | number | boolean;
  };
  submit?: {
    trim?: boolean;
    prefixUrlProtocol?: boolean;
    omitWhenEmpty?: boolean;
    omitWhenHidden?: boolean;
  };
  layout?: {
    row?: number;
    colSpan?: 1 | 2;
    className?: string;
  };
  validation?: SchemaFieldValidation;
  dynamicByField?: {
    field: string;
    values: Record<
      string,
      {
        placeholder?: string;
        description?: string;
        inputMode?: "text" | "url" | "email" | "numeric" | "decimal";
        uppercase?: boolean;
        validation?: SchemaFieldValidation;
      }
    >;
  };
};

export type TextSchemaField<TName extends string = string> =
  BaseField<TName> & {
    type: "text" | "url" | "email" | "password";
    inputMode?: "text" | "url" | "email" | "numeric" | "decimal";
  };

export type NumberSchemaField<TName extends string = string> =
  BaseField<TName> & {
    type: "number";
  };

export type SelectSchemaField<TName extends string = string> =
  BaseField<TName> & {
    type: "select";
    options: Array<{
      label: string;
      value: string;
      description?: string;
    }>;
  };

export type ColorSchemaField<TName extends string = string> =
  BaseField<TName> & {
    type: "color";
  };

export type CheckboxSchemaField<TName extends string = string> =
  BaseField<TName> & {
    type: "checkbox";
  };

export type UploadSchemaField<TName extends string = string> =
  BaseField<TName> & {
    type: "upload";
    acceptedExtensions: string[];
    accept?: string;
    maxSizeMb?: number;
    minRows?: number;
    maxRows?: number;
  };

export type SchemaField<TName extends string = string> =
  | TextSchemaField<TName>
  | NumberSchemaField<TName>
  | SelectSchemaField<TName>
  | ColorSchemaField<TName>
  | CheckboxSchemaField<TName>
  | UploadSchemaField<TName>;

export type SchemaForm<TFormValues extends Record<string, unknown>> = {
  title: string;
  description: string;
  responsiveChip?: SchemaChip;
  chips?: SchemaChip[];
  fields: SchemaField<Extract<keyof TFormValues, string>>[];
  submit: SchemaButton;
  api: SchemaApiEndpoint;
  successEvent?: string;
};

export type SchemaMetricCard = {
  label: string;
  valuePath: string;
  icon?: LucideIcon;
  fallback?: ReactNode;
};

export type SchemaActivityPeriod = "week" | "month" | "year";

export type SchemaAnalyticsDistributionSection = {
  type: "distribution";
  api?: SchemaApiEndpoint;
  title: string;
  description?: string;
  valuePath: string;
  labelPath?: string;
  countPath?: string;
  percentagePath?: string;
  badgeLabel?: string;
  emptyText?: string;
  secondary?: {
    title: string;
    totalLabel?: string;
    segments: Array<{
      label: string;
      valuePath: string;
      className?: string;
    }>;
  };
};

export type SchemaAnalyticsActivitySection = {
  type: "activity";
  api: SchemaApiEndpoint;
  defaultPeriod?: SchemaActivityPeriod;
  titleByPeriod?: Partial<Record<SchemaActivityPeriod, string>>;
  descriptionTemplate?: string;
  pointLabelPath?: string;
  pointValuePath?: string;
  pointsPath?: string;
  growthPath?: string;
  periodPath?: string;
  selectedDatePath?: string;
  refreshEvent?: string;
};

export type SchemaAnalyticsSection =
  | SchemaAnalyticsDistributionSection
  | SchemaAnalyticsActivitySection;

export type SchemaAnalyticsPanel = {
  title: string;
  description: string;
  chips?: SchemaChip[];
  cards?: SchemaMetricCard[];
  activityTitle?: string;
  api?: SchemaApiEndpoint;
  sections?: SchemaAnalyticsSection[];
};

export type SchemaColumn<TItem extends Record<string, unknown>> = {
  key: Extract<keyof TItem, string> | string;
  label: string;
  className?: string;
};

export type SchemaPaginationConfig = {
  enabled: true;
  pageParam?: string;
  limitParam?: string;
  pageSize?: number;
  itemsPath?: string;
  paginationPath?: string;
  itemLabel?: string;
};

export type SchemaPaginationState = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore?: boolean;
};

export type SchemaDeleteAction = {
  api: SchemaApiEndpoint;
  idPath?: string;
  subjectValuePath?: string;
  subjectValueTemplate?: string;
  eyebrow: string;
  title: string;
  subjectLabel: string;
  confirmKeyword?: string;
  confirmLabel: string;
  loadingLabel?: string;
  successMessage: string;
  errorMessage: string;
  successEvent?: string;
};

export type SchemaDataPanel<TItem extends Record<string, unknown>> = {
  title: string;
  description: string;
  chips?: SchemaChip[];
  columns: SchemaColumn<TItem>[];
  api?: SchemaApiEndpoint;
  deleteAction?: SchemaDeleteAction;
  pagination?: SchemaPaginationConfig;
  emptyState?: {
    title: string;
    description: string;
    icon: LucideIcon;
  };
  rowSlot?: string;
};

export type SchemaCustomPanel = {
  title: string;
  description: string;
  chips?: SchemaChip[];
  slot: string;
};

export type FeatureToolSchema<
  TFormValues extends Record<string, unknown>,
  TListItem extends Record<string, unknown>,
  TAnalytics extends Record<string, unknown> = Record<string, unknown>,
> = {
  slug: string;
  route: string;
  header: {
    icon: LucideIcon;
    title: string;
    description: string;
    canonical: string;
  };
  panels: {
    form: SchemaForm<TFormValues>;
    secondary: SchemaCustomPanel;
    analytics: SchemaAnalyticsPanel;
    data: SchemaDataPanel<TListItem>;
  };
  mapCreateResponse?: (response: unknown) => unknown;
  mapAnalytics?: (response: unknown) => TAnalytics;
};

export type AnyFeatureToolSchema = FeatureToolSchema<
  Record<string, unknown>,
  Record<string, unknown>,
  Record<string, unknown>
>;

export type FeaturePanelSlots<TItem extends Record<string, unknown>> = {
  secondary?: ReactNode;
  activity?: ReactNode;
  dataPanelDescription?: string;
  dataPanelHeader?: ReactNode;
  dataHeader?: ReactNode;
  dataContent?: ReactNode;
  row?: (item: TItem) => ReactNode;
};
