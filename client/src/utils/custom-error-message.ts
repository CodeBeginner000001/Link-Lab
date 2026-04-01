import { CustomErrorApiResponse } from "@/service/auth/types";

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

export function getFormFieldErrors<TField extends string>(
  res: CustomErrorApiResponse,
  fields: readonly TField[],
  options: FormFieldErrorOptions = {},
): FormFieldErrors<TField> | null {
  const { statusCodes = [400, 422] } = options;

  if (!("error" in res) || !statusCodes.includes(res.statusCode)) {
    return null;
  }

  const messages = Array.isArray(res.error.message)
    ? res.error.message
    : [res.error.message];
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

export function getUserFriendlyMessage(res: CustomErrorApiResponse) {
  if ("error" in res) {
    const message = res.error.message as string[] | string;

    if (Array.isArray(message)) {
      return message[0] || "Service unavailable";
    }

    return message || "Service unavailable";
  }

  return res.result.data?.message;
}
