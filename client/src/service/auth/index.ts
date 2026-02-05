import {
  ApiErrorResponse,
  GetSessionDataApiSuccessResponse,
  ResendOTPApiSuccessResponse,
  SignUpApiSuccessResponse,
  VerifySignUpOTPApiSuccessResponse,
} from "@/interfaces/api";
import { redirect } from "next/navigation";

const Base_URL = "http://localhost:4000/v1/auth";
export const signup = async (name: string, email: string, password: string) => {
  try {
    const response = await fetch(`${Base_URL}/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
      credentials: "include",
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

export const GetSessionData = async (cookieData: string) => {
  try {
    const response = await fetch(`${Base_URL}/otp/session`, {
      method: "GET",
      headers: {
        Cookie: cookieData,
      },
      cache: "no-store",
    });
    if (!response.ok) {
      const error: ApiErrorResponse = await response.json();
      return {
        statusCode: response.status,
        error,
      };
    }
    const data: GetSessionDataApiSuccessResponse = await response.json();
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

export const ResendOTP = async () => {
  try {
    const response = await fetch(`${Base_URL}/otp/resend`, {
      method: "POST",
      credentials: "include",
      cache: "no-store",
    });
    if (!response.ok) {
      const error: ApiErrorResponse = await response.json();
      return {
        statusCode: response.status,
        error,
      };
    }
    const data: ResendOTPApiSuccessResponse = await response.json();
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

export const VerifySignUpOTP = async (otp: string) => {
  try {
    const response = await fetch(`${Base_URL}/otp/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        otp,
      }),
      cache: "no-store",
    });
    if (!response.ok) {
      const error: ApiErrorResponse = await response.json();
      return {
        statusCode: response.status,
        error,
      };
    }
    const data: VerifySignUpOTPApiSuccessResponse = await response.json();
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

export const GetCurrentUser = async (cookieData: string) => {
  try {
    const response = await fetch(`${Base_URL}/me`, {
      method: "GET",
      headers:{
        Cookie: cookieData
      },
      credentials: "include",
      cache: "no-store",
    });
    if (!response.ok) {
      const error: ApiErrorResponse = await response.json();
      return {
        statusCode: response.status,
        error,
      };
    }
    const data = await response.json();
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