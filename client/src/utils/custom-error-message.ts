import { CustomErrorApiResponse } from "@/interfaces/api";

export function parseErrorMessage(message: string) {
  const [field, ...errorParts] = message.split(":");

  return {
    field: field.trim().toLowerCase(),
    error: errorParts.join(":").trim() || field.trim(),
  };
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
