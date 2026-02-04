export interface ApiFieldError {
  field: string;
  error: string;
};

export interface ApiErrorResponse {
  success: boolean;
  message: string;
  errors: ApiFieldError[];
};

export interface SignUpApiDataResponse {
  email: string;
  message: string;
};

export interface SignUpApiSuccessResponse {
  success: boolean;
  message: string;
  data: SignUpApiDataResponse;
};

export type CustomErrorApiResponse =
  | { statusCode: number; result: SignUpApiSuccessResponse }
  | { statusCode: number; error: ApiErrorResponse };

export interface GetSessionDataApiDataResponse {
  email: string;
  otp_resend_after: string;
};

export interface GetSessionDataApiSuccessResponse {
  success: boolean;
  message: string;
  data: GetSessionDataApiDataResponse;
};

export interface ResendOTPApiDataResponse {
  otp_resend_after: string;
};

export interface ResendOTPApiSuccessResponse {
  success: boolean;
  message: string;
  data: ResendOTPApiDataResponse;
};

export interface VerifySignUpOTPApiDataResponse {
  accessToken: string
}

export interface VerifySignUpOTPApiSuccessResponse {
  success: boolean;
  message: string;
  data: ResendOTPApiDataResponse;
}
