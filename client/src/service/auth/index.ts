import { ApiErrorResponse, SignUpApiSuccessResponse } from "@/interfaces/api";

const Base_URL = "http://localhost:4000/v1/auth";
export const signup = async (name: string, email: string, password: string) => {
  try {
    const response = await fetch(`${Base_URL}/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        email,
        password,
      }),
    });
    if (!response.ok) {
      const error: ApiErrorResponse = await response.json();
      return {
        statusCode: response.status,
        error,
      };
    }
    const data: SignUpApiSuccessResponse = await response.json();
    return {
      statusCode: response.status,
      result: data,
    };
  } catch {
    return {
      statusCode: 503,
      error: {
        success: false,
        message: "Server unreachable. Please try again later.",
        errors: [],
      },
    };
  }
};
