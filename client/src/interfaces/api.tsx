export type ApiFieldError = {
  field: string;
  error: string;
};

export type ApiErrorResponse = {
  success: boolean;
  message: string;
  errors: ApiFieldError[];
};

export type SignUpApiDataResponse = {
  email: string;
  message: string;
};

export type SignUpApiSuccessResponse = {
  success: boolean;
  message: string;
  data: SignUpApiDataResponse;
};

export type SignUpApiResponse =
  | { statusCode: number; result: SignUpApiSuccessResponse }
  | { statusCode: number; error: ApiErrorResponse };

export type GetSessionDataApiDataResponse = {
  email: string;
  otp_resend_after: string;
};

export type GetSessionDataApiSuccessResponse = {
  success: boolean;
  message: string;
  data: GetSessionDataApiDataResponse;
};

export type ResendOTPApiDataResponse = {
  otp_resend_after: string;
};

export type ResendOTPApiSuccessResponse = {
  success: boolean;
  message: string;
  data: ResendOTPApiDataResponse;
};
