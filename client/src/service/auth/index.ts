import {
  ApiErrorResponse,
  GetSessionDataApiSuccessResponse,
  LoginApiSuccessResponse,
  ResendOTPApiSuccessResponse,
  SignUpApiSuccessResponse,
  VerifySignUpOTPApiSuccessResponse,
} from "@/interfaces/api";

const BASE_URL = "http://localhost:4000/v1"
export const signup = async (name: string, email: string, password: string) => {
  try {
    const response = await fetch(`${BASE_URL}/auth/signup`, {
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
    const response = await fetch(`${BASE_URL}/auth/otp/session`, {
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
    const response = await fetch(`${BASE_URL}/auth/otp/resend`, {
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
    const response = await fetch(`${BASE_URL}/auth/otp/verify`, {
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

export const login = async (email: string, password: string) => {
  try {
    const response = await fetch(`${BASE_URL}/auth/login`, {
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
      error: {
        success: false,
        message: "Server unreachable. Please try again later.",
        errors: [],
      },
    };
  }
};

// export const refreshToken = async()=>{
//   try {
//     const response = await fetch(`/api/auth/refresh`, {
//       method: "POST",
//       credentials: "include",
//     });
//     if (!response.ok) {
//       const error: ApiErrorResponse = await response.json();
//       return {
//         statusCode: response.status,
//         error,
//       };
//     }
//     const data = await response.json();

//     return {
//       statusCode: response.status,
//       result: data,
//     };
//   } catch {
//     return {
//       statusCode: 503,
//       error: {
//         success: false,
//         message: "Server unreachable. Please try again later.",
//         errors: [],
//       },
//     };
//   }
// }