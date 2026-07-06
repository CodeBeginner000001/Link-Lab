import { ApiErrorResponse, CustomErrorApiResponse } from "@/service/auth/types";

type ApiErrorLike = Partial<ApiErrorResponse> & {
  message?: unknown;
  error?: unknown;
  details?: unknown;
};

type ApiResultLike = {
  error?: ApiErrorLike;
  result?: {
    data?: {
      message?: unknown;
    };
  };
};

type FormFieldErrors<TField extends string> = Partial<Record<TField, string>>;

type FormFieldErrorOptions = {
  statusCodes?: readonly number[];
};

type HandleFormFieldErrorOptions<TField extends string> = FormFieldErrorOptions & {
  invalidMessage?: string;
  notify?: (message: string, type: "error") => void;
  setErrors: (errors: FormFieldErrors<TField>) => void;
};

export function parseErrorMessage(message: string) {
  const [field, ...errorParts] = message.split(":");

  return {
    field: field.trim().toLowerCase(),
    error: errorParts.join(":").trim() || field.trim(),
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function collectDetailMessages(details: unknown): string[] {
  if (!Array.isArray(details)) {
    return [];
  }

  return details.flatMap((detail) => {
    if (!isRecord(detail)) {
      return [];
    }

    const constraints = detail.constraints;
    const childMessages = collectDetailMessages(detail.children);

    if (isRecord(constraints)) {
      const messages = Object.values(constraints).filter(
        (message): message is string => typeof message === "string",
      );

      return [...messages, ...childMessages];
    }

    return childMessages;
  });
}

export function getApiErrorMessages(error: ApiErrorLike | null | undefined) {
  if (!error) {
    return [];
  }

  const message = error.message;

  if (Array.isArray(message)) {
    return message
      .flatMap((item) => (typeof item === "string" ? [item] : []))
      .filter(Boolean);
  }

  if (typeof message === "string" && message.trim()) {
    return [message];
  }

  const detailMessages = collectDetailMessages(error.details);

  if (detailMessages.length) {
    return detailMessages;
  }

  return typeof error.error === "string" && error.error.trim()
    ? [error.error]
    : [];
}

export function getApiErrorMessage(
  error: ApiErrorLike | null | undefined,
  fallback = "Request failed. Please try again.",
) {
  return getApiErrorMessages(error)[0] ?? fallback;
}

export function getFormFieldErrors<TField extends string>(
  res: CustomErrorApiResponse,
  fields: readonly TField[],
  options: FormFieldErrorOptions = {},
): FormFieldErrors<TField> | null {
  const { statusCodes = [400, 422] } = options;

  if (!("error" in res) || !statusCodes.includes(res.statusCode)) {
    return null;
  }

  const messages = getApiErrorMessages(res.error);
  const allowedFields = new Set(fields);
  const fieldErrors: FormFieldErrors<TField> = {};

  messages.forEach((message) => {
    const parsedMessage = parseErrorMessage(message);
    const field = parsedMessage.field as TField;

    if (!allowedFields.has(field)) {
      return;
    }

    fieldErrors[field] = parsedMessage.error;
  });

  return Object.keys(fieldErrors).length > 0 ? fieldErrors : null;
}

export function handleFormFieldErrors<TField extends string>(
  res: CustomErrorApiResponse,
  fields: readonly TField[],
  {
    invalidMessage = "Please fill form correctly",
    notify,
    setErrors,
    statusCodes,
  }: HandleFormFieldErrorOptions<TField>,
) {
  const fieldErrors = getFormFieldErrors(res, fields, { statusCodes });

  if (!fieldErrors) {
    return false;
  }

  setErrors(fieldErrors);
  notify?.(invalidMessage, "error");

  return true;
}

export function getUserFriendlyMessage(
  res: CustomErrorApiResponse | ApiResultLike,
) {
  if ("error" in res) {
    return getApiErrorMessage(res.error, "Service unavailable");
  }

  const successMessage = res.result?.data?.message;

  return typeof successMessage === "string" ? successMessage : "";
}
