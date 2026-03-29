import { BACKEND_API_URL_ENV } from "@/config/api";
import {
  ApiErrorResponse,
  ApiSuccessResponse,
  GetCurrentUserApiSuccessResponse,
  GetSessionDataApiSuccessResponse,
  LoginApiSuccessResponse,
  RefreshAccessTokenApiSuccessResponse,
  ResendOTPApiSuccessResponse,
  SignUpApiSuccessResponse,
  VerifySignUpOTPApiSuccessResponse,
} from "@/interfaces/api";

const BACKEND_API_URL = BACKEND_API_URL_ENV;
const FRONTEND_AUTH_API_URL = "/api/auth";

const createServiceUnavailableError = (path: string): ApiErrorResponse => ({
  success: false,
  statusCode: 503,
  message: ["Server unreachable. Please try again later."],
  error: "Service Unavailable",
  timeStamp: new Date().toISOString(),
  path,
});

export const Signup = async (name: string, email: string, password: string) => {
  try {
    const response = await fetch(`${FRONTEND_AUTH_API_URL}/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
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
      error: createServiceUnavailableError("/v1/auth/signup"),
    };
  }
};

export const GetSessionData = async (cookieData: string) => {
  try {
    const response = await fetch(`${BACKEND_API_URL}/auth/signup/session`, {
      method: "GET",
      headers: {
        Cookie: cookieData,
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
    const data: GetSessionDataApiSuccessResponse = await response.json();
    return {
      statusCode: response.status,
      result: data,
    };
  } catch {
    return {
      statusCode: 503,
      error: createServiceUnavailableError("/v1/auth/otp/session"),
    };
  }
};

export const ResendOTP = async () => {
  try {
    const response = await fetch(`${FRONTEND_AUTH_API_URL}/resend-otp`, {
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
    const data : ResendOTPApiSuccessResponse = await response.json();
    return {
      statusCode: response.status,
      result: data,
    };
  } catch {
    return {
      statusCode: 503,
      error: createServiceUnavailableError("/v1/auth/otp/resend"),
    };
  }
};

export const VerifySignUpOTP = async (otp: string) => {
  try {
    const response = await fetch(`${FRONTEND_AUTH_API_URL}/verify-otp`, {
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
      error: createServiceUnavailableError("/v1/auth/otp/verify"),
    };
  }
};

export const GetCurrentUser = async (accessToken: string) => {
  try {
    const response = await fetch(`${BACKEND_API_URL}/auth/getUser`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      return null;
    }

    const data: GetCurrentUserApiSuccessResponse = await response.json();

    return data.data.user;
  } catch {
    return null;
  }
};

export const RefreshAccessToken = async (refreshToken: string) => {
  try {
    const response = await fetch(`${BACKEND_API_URL}/auth/refresh-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      cache: "no-store",
      body: JSON.stringify({
        refreshToken,
      }),
    });

    if (!response.ok) {
      const error: ApiErrorResponse = await response.json();
      return {
        statusCode: response.status,
        error,
      };
    }

    const data: RefreshAccessTokenApiSuccessResponse = await response.json();

    return {
      statusCode: response.status,
      result: data,
    };
  } catch {
    return {
      statusCode: 503,
      error: createServiceUnavailableError("/v1/auth/refresh-token"),
    };
  }
};

export const Login = async (email: string, password: string) => {
  try {
    const response = await fetch(`${FRONTEND_AUTH_API_URL}/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
      credentials: "include",
      body: JSON.stringify({
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
    const data: LoginApiSuccessResponse = await response.json();

    return {
      statusCode: response.status,
      result: data,
    };
  } catch {
    return {
      statusCode: 503,
      error: createServiceUnavailableError("/v1/auth/login"),
    };
  }
};
export const Logout = async () => {
  try {
    const response = await fetch(`${FRONTEND_AUTH_API_URL}/logout`, {
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

    const data: ApiSuccessResponse<{ message: string }> =
      await response.json();

    return {
      statusCode: response.status,
      result: data,
    };
  } catch {
    return {
      statusCode: 503,
      error: createServiceUnavailableError("/v1/auth/logout"),
    };
  }
};

export const ForgetPassword = async (email: string) => {
  try {
    const response = await fetch(`${FRONTEND_AUTH_API_URL}/forgot-password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        email,
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
      error: createServiceUnavailableError("/v1/auth/forgot-password"),
    };
  }
};
