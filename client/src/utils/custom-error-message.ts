import { SignUpApiResponse } from "@/interfaces/api";

export function getUserFriendlyMessage(res: SignUpApiResponse) {
  if ("error" in res) {
    console.log(res.error.message)
    switch (res.statusCode) {
      case 400:
        return "Invalid request. Please check your input.";

      case 422:
        return "Please fix the highlighted fields.";

      case 500:
        return "Something went wrong on our side. Please try again.";

      case 503:
        return "Service is temporarily unavailable. Try again later.";

      default:
        return res.error.message.split(":")[1] || "Unexpected error occurred.";
    }
  }
  return res.result.data.message;
}
