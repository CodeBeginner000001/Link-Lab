"use client";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { getApiErrorMessage } from "@/utils/custom-error-message";
import { cn } from "@/utils/tailwindcss-merger";
import { useToastNotification } from "@/utils/toast";
import { FileUp, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { DragEvent, FormEvent, useMemo, useState } from "react";
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
  if (field.type === "upload") {
    return null;
  }

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

const hasUploadField = (fields: SchemaField[]) =>
  fields.some((field) => field.type === "upload");

const buildFormDataPayload = (
  fields: SchemaField[],
  values: Record<string, unknown>,
) => {
  const formData = new FormData();

  fields.forEach((field) => {
    if (field.submit?.omitWhenHidden && !isFieldVisible(field, values)) {
      return;
    }

    const value = getSubmitValue(field, values[field.name]);

    if (field.submit?.omitWhenEmpty && value === "") {
      return;
    }

    if (field.type === "upload") {
      if (value instanceof File) {
        formData.append(field.name, value);
      }
      return;
    }

    formData.append(field.name, String(value));
  });

  return formData;
};

const getUploadValidationError = (
  field: SchemaField,
  value: unknown,
): string | null => {
  if (field.type !== "upload") {
    return null;
  }

  if (!(value instanceof File)) {
    return field.required ? `${field.label} is required.` : null;
  }

  const fileName = value.name.trim();
  const extensionCount = (fileName.match(/\./g) ?? []).length;
  const lowerFileName = fileName.toLowerCase();
  const acceptedExtensions = field.acceptedExtensions.map((extension) =>
    extension.toLowerCase(),
  );
  const extension = acceptedExtensions.find((item) =>
    lowerFileName.endsWith(item),
  );

  if (!extension || extensionCount !== 1) {
    return `${field.label} must be one ${acceptedExtensions.join(", ")} file with no extra extensions.`;
  }

  if (field.maxSizeMb && value.size > field.maxSizeMb * 1024 * 1024) {
    return `${field.label} must be ${field.maxSizeMb} MB or smaller.`;
  }

  return null;
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
      const uploadError = visibleFields
        .map((field) => getUploadValidationError(field, values[field.name]))
        .find(Boolean);

      if (uploadError) {
        notify(uploadError, "error");
        return;
      }

      const isMultipart = hasUploadField(schema.fields);
      const payload = isMultipart
        ? buildFormDataPayload(schema.fields, values)
        : buildPayload(schema.fields, values);
      const body: BodyInit = isMultipart
        ? (payload as FormData)
        : JSON.stringify(payload);

      const response = await fetch(endpoint, {
        method: schema.api.method ?? "POST",
        headers: isMultipart
          ? undefined
          : {
              "Content-Type": "application/json",
            },
        body,
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
              values={values}
              className={cn(
                field.layout?.colSpan === 2 && "sm:col-span-2",
                field.layout?.className,
              )}
              isLoading={isLoading}
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
  values,
  className,
  isLoading,
  onChange,
}: {
  field: SchemaField;
  value: unknown;
  values: Record<string, unknown>;
  className?: string;
  isLoading?: boolean;
  onChange: (value: unknown) => void;
}) {
  const dynamicConfig = field.dynamicByField
    ? field.dynamicByField.values[
        String(values[field.dynamicByField.field] ?? "")
      ]
    : undefined;
  const description = dynamicConfig?.description ?? field.description;
  const placeholder = dynamicConfig?.placeholder ?? field.placeholder;
  const validation = {
    ...field.validation,
    ...dynamicConfig?.validation,
  };
  const inputMode =
    dynamicConfig?.inputMode ??
    ("inputMode" in field ? field.inputMode : undefined);

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
        {description ? <FieldDescription text={description} /> : null}
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
          {description ? <FieldDescription text={description} /> : null}
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

  if (field.type === "upload") {
    return (
      <SchemaUploadControl
        field={field}
        value={value}
        className={className}
        isLoading={Boolean(isLoading)}
        onChange={onChange}
      />
    );
  }

  return (
    <div className={cn("grid sm:gap-2", className)}>
      <Label htmlFor={field.name} className="max-sm:text-xs max-sm:mb-2">{field.label}</Label>
      <Input
        id={field.name}
        name={field.name}
        type={field.type}
        required={field.required}
        placeholder={placeholder}
        className="text-base placeholder:text-sm sm:placeholder:text-base"
        pattern={validation.pattern}
        min={validation.min}
        max={validation.max}
        step={validation.step}
        minLength={validation.minLength}
        maxLength={validation.maxLength}
        inputMode={inputMode}
        value={String(value ?? "")}
        onChange={(event) => {
          const nextValue =
            field.type === "number"
              ? Number(event.target.value)
              : dynamicConfig?.uppercase
                ? event.target.value.toUpperCase()
                : event.target.value;
          onChange(nextValue);
        }}
      />
      {description ? <FieldDescription text={description} /> : null}
    </div>
  );
}

function SchemaUploadControl({
  field,
  value,
  className,
  isLoading,
  onChange,
}: {
  field: Extract<SchemaField, { type: "upload" }>;
  value: unknown;
  className?: string;
  isLoading: boolean;
  onChange: (value: unknown) => void;
}) {
  const [isDragging, setIsDragging] = useState(false);
  const file = value instanceof File ? value : null;
  const accept =
    field.accept ?? field.acceptedExtensions.map((item) => item).join(",");

  const handleDragOver = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
    setIsDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLLabelElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setIsDragging(false);
    }
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (isLoading) {
      return;
    }
    onChange(event.dataTransfer.files?.[0] ?? null);
  };

  return (
    <div className={cn("grid gap-2", className)}>
      <Label htmlFor={field.name}>{field.label}</Label>
      <label
        htmlFor={field.name}
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-[hsl(var(--border))] bg-[hsl(var(--muted)/0.35)] px-4 py-5 text-center transition-colors hover:bg-[hsl(var(--muted)/0.55)]",
          isDragging &&
            "border-[hsl(var(--primary))] bg-[hsl(var(--primary)/0.08)]",
          isLoading && "cursor-wait opacity-80",
        )}
      >
        {isLoading ? (
          <Loader2 className="h-5 w-5 animate-spin text-[hsl(var(--primary))]" />
        ) : (
          <FileUp className="h-5 w-5 text-[hsl(var(--primary))]" />
        )}
        <span className="text-sm font-medium">
          {isLoading
            ? "Uploading file..."
            : file
              ? file.name
              : isDragging
                ? "Drop file to upload"
                : "Drag and drop or choose file"}
        </span>
        <span className="text-xs text-[hsl(var(--muted-foreground))]">
          {field.acceptedExtensions.join(", ")}
          {field.maxSizeMb ? ` up to ${field.maxSizeMb} MB` : ""}
        </span>
      </label>
      <input
        id={field.name}
        name={field.name}
        type="file"
        required={field.required}
        accept={accept}
        disabled={isLoading}
        onChange={(event) => onChange(event.target.files?.[0] ?? null)}
        className="sr-only"
      />
      {field.description ? <FieldDescription text={field.description} /> : null}
    </div>
  );
}

function FieldDescription({ text }: { text: string }) {
  return (
    <p className="text-[10px] sm:text-xs leading-5 text-[hsl(var(--muted-foreground)/0.85)]">
      {text}
    </p>
  );
}
