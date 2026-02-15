import { CustomErrorApiResponse } from "@/interfaces/api";

export function getUserFriendlyMessage(res: CustomErrorApiResponse) {
  if ("error" in res) {
    switch (res.statusCode) {
      case 500:
        return "Something went wrong on our side. Please try again.";

      case 503:
        return "Service is temporarily unavailable. Try again later.";

      default:
        return res.error.message.split(":")[1] || "Unexpected error occurred.";
    }
  }
  return res.result.message;
}
