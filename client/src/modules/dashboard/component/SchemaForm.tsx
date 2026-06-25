"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { getApiErrorMessage } from "@/utils/custom-error-message";
import { cn } from "@/utils/tailwindcss-merger";
import { useToastNotification } from "@/utils/toast";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { FormEvent, useMemo, useState } from "react";
import type {
  SchemaField,
  SchemaForm as SchemaFormConfig,
} from "../schema-driven/types";

type SchemaFormProps<TFormValues extends Record<string, unknown>> = {
  schema: SchemaFormConfig<TFormValues>;
  submitIcon?: ReactNode;
  onSubmitStart?: () => void;
  onSuccess?: (response: unknown) => void;
  onSubmitEnd?: () => void;
};

const getInitialValue = (field: SchemaField) => {
  if (field.type === "checkbox") {
    return Boolean(field.defaultValue);
  }

  if (field.defaultValue !== undefined) {
    return field.defaultValue;
  }

  if (field.type === "color") {
    return field.defaultValue;
  }

  return "";
};

const getFieldRows = (fields: SchemaField[]) => {
  const rows = new Map<number, SchemaField[]>();

  fields.forEach((field, index) => {
    const row = field.layout?.row ?? index + 1;
    rows.set(row, [...(rows.get(row) ?? []), field]);
  });

  return [...rows.entries()]
    .sort(([left], [right]) => left - right)
    .map(([, rowFields]) => rowFields);
};

const isFieldVisible = (
  field: SchemaField,
  values: Record<string, unknown>,
) => {
  if (!field.visibleWhen) {
    return true;
  }

  return values[field.visibleWhen.field] === field.visibleWhen.equals;
};

const getSubmitValue = (field: SchemaField, value: unknown) => {
  if (typeof value !== "string") {
    return value;
  }

  let nextValue = field.submit?.trim ? value.trim() : value;

  if (
    field.submit?.prefixUrlProtocol &&
    nextValue &&
    !nextValue.startsWith("http://") &&
    !nextValue.startsWith("https://")
  ) {
    nextValue = `https://${nextValue}`;
  }

  return nextValue;
};

const buildPayload = (
  fields: SchemaField[],
  values: Record<string, unknown>,
) => {
  return fields.reduce<Record<string, unknown>>((payload, field) => {
    if (field.submit?.omitWhenHidden && !isFieldVisible(field, values)) {
      return payload;
    }

    const value = getSubmitValue(field, values[field.name]);

    if (field.submit?.omitWhenEmpty && value === "") {
      return payload;
    }

    payload[field.name] = value;
    return payload;
  }, {});
};

export default function SchemaForm<
  TFormValues extends Record<string, unknown>,
>({
  schema,
  submitIcon,
  onSubmitStart,
  onSuccess,
  onSubmitEnd,
}: SchemaFormProps<TFormValues>) {
  const router = useRouter();
  const notify = useToastNotification();
  const [isLoading, setIsLoading] = useState(false);
  const [values, setValues] = useState<Record<string, unknown>>(() =>
    Object.fromEntries(
      schema.fields.map((field) => [field.name, getInitialValue(field)]),
    ),
  );
  const visibleFields = useMemo(
    () => schema.fields.filter((field) => isFieldVisible(field, values)),
    [schema.fields, values],
  );
  const fieldRows = useMemo(() => getFieldRows(visibleFields), [visibleFields]);

  const endpoint = useMemo(() => {
    if (schema.api.useProxy === false) {
      return schema.api.path;
    }

    return schema.api.path.startsWith("/api/")
      ? schema.api.path
      : `/api/features${schema.api.path}`;
  }, [schema.api.path, schema.api.useProxy]);

  const setFieldValue = (name: string, value: unknown) => {
    setValues((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setIsLoading(true);
      onSubmitStart?.();
      if (schema.successEvent) {
        window.dispatchEvent(new CustomEvent(`${schema.successEvent}:start`));
      }
      const payload = buildPayload(schema.fields, values);

      const response = await fetch(endpoint, {
        method: schema.api.method ?? "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const json = await response.json().catch(() => null);

      if (!response.ok) {
        notify(
          getApiErrorMessage(json, "Request failed. Please try again."),
          "error",
        );
        if (
          json &&
          typeof json === "object" &&
          (json as { saved?: boolean }).saved === true
        ) {
          if (schema.successEvent) {
            window.dispatchEvent(
              new CustomEvent(schema.successEvent, {
                detail: { response: json },
              }),
            );
          }
          router.refresh();
        }
        return;
      }

      notify(`${schema.submit.label} completed.`, "success");
      if (schema.successEvent) {
        window.dispatchEvent(
          new CustomEvent(schema.successEvent, {
            detail: { response: json },
          }),
        );
      }
      onSuccess?.(json);
      router.refresh();
    } catch {
      notify("Something went wrong. Please try again.", "error");
    } finally {
      setIsLoading(false);
      if (schema.successEvent) {
        window.dispatchEvent(new CustomEvent(`${schema.successEvent}:end`));
      }
      onSubmitEnd?.();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fieldRows.map((rowFields, index) => (
        <div
          key={index}
          className={cn(
            "grid gap-4 max-[540px]:gap-3",
            rowFields.length > 1 && "sm:grid-cols-2",
          )}
        >
          {rowFields.map((field) => (
            <SchemaFieldControl
              key={field.name}
              field={field}
              value={values[field.name]}
              className={cn(
                field.layout?.colSpan === 2 && "sm:col-span-2",
                field.layout?.className,
              )}
              onChange={(value) => setFieldValue(field.name, value)}
            />
          ))}
        </div>
      ))}

      <Button type="submit" disabled={isLoading} className="w-full sm:w-auto">
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            {schema.submit.loadingLabel ?? "Working..."}
          </>
        ) : (
          <>
            {submitIcon}
            {schema.submit.label}
          </>
        )}
      </Button>
    </form>
  );
}

function SchemaFieldControl({
  field,
  value,
  className,
  onChange,
}: {
  field: SchemaField;
  value: unknown;
  className?: string;
  onChange: (value: unknown) => void;
}) {
  if (field.type === "select") {
    return (
      <div className={cn("grid gap-2", className)}>
        <Label htmlFor={field.name}>{field.label}</Label>
        <select
          id={field.name}
          name={field.name}
          required={field.required}
          value={String(value ?? "")}
          onChange={(event) => onChange(event.target.value)}
          className="flex h-10 w-full rounded-lg border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
        >
          {field.options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {field.description ? (
          <FieldDescription text={field.description} />
        ) : null}
      </div>
    );
  }

  if (field.type === "checkbox") {
    return (
      <label
        className={cn(
          "flex items-center justify-between gap-4 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-3 text-sm",
          className,
        )}
      >
        <span>
          <span className="font-medium">{field.label}</span>
          {field.description ? (
            <FieldDescription text={field.description} />
          ) : null}
        </span>
        <input
          name={field.name}
          type="checkbox"
          checked={Boolean(value)}
          onChange={(event) => onChange(event.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden="true"
          className="relative h-6 w-11 shrink-0 rounded-full bg-[hsl(var(--muted))] transition-colors after:absolute after:left-1 after:top-1 after:h-4 after:w-4 after:rounded-full after:bg-[hsl(var(--background))] after:shadow-sm after:transition-transform peer-checked:bg-[hsl(var(--primary))] peer-checked:after:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-[hsl(var(--ring))]"
        >
          <span className="sr-only">{field.label}</span>
        </span>
      </label>
    );
  }

  return (
    <div className={cn("grid gap-2", className)}>
      <Label htmlFor={field.name}>{field.label}</Label>
      <Input
        id={field.name}
        name={field.name}
        type={field.type}
        required={field.required}
        placeholder={field.placeholder}
        pattern={field.validation?.pattern}
        min={field.validation?.min}
        max={field.validation?.max}
        step={field.validation?.step}
        inputMode={"inputMode" in field ? field.inputMode : undefined}
        value={String(value ?? "")}
        onChange={(event) => {
          const nextValue =
            field.type === "number"
              ? Number(event.target.value)
              : event.target.value;
          onChange(nextValue);
        }}
      />
      {field.description ? <FieldDescription text={field.description} /> : null}
    </div>
  );
}

function FieldDescription({ text }: { text: string }) {
  return (
    <p className="text-xs leading-5 text-[hsl(var(--muted-foreground)/0.85)]">
      {text}
    </p>
  );
}
