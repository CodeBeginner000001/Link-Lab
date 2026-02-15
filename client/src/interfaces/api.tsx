export interface ApiFieldError {
  field: string;
  error: string;
}

export interface ApiErrorResponse {
  success: boolean;
  message: string;
  errors: ApiFieldError[];
}

export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

export interface SignUpApiDataResponse {
  email: string;
}

export type SignUpApiSuccessResponse = ApiSuccessResponse<SignUpApiDataResponse>;

export interface LoginApiDataResponse {
  accessToken: string;
}

export type LoginApiSuccessResponse = ApiSuccessResponse<LoginApiDataResponse>;

export interface VerifySignUpOTPApiDataResponse {
  accessToken: string;
}

export type VerifySignUpOTPApiSuccessResponse = ApiSuccessResponse<VerifySignUpOTPApiDataResponse>;

export interface GetSessionDataApiDataResponse {
  email: string;
  otp_resend_after: string;
}

export type GetSessionDataApiSuccessResponse = ApiSuccessResponse<GetSessionDataApiDataResponse>

export interface ResendOTPApiDataResponse {
  otp_resend_after: string;
}

export type ResendOTPApiSuccessResponse = ApiSuccessResponse<ResendOTPApiDataResponse>


export type CustomErrorApiResponse =
  | { statusCode: number; result: SignUpApiSuccessResponse }
  | { statusCode: number; result: LoginApiSuccessResponse }
  | { statusCode: number; result: ResendOTPApiSuccessResponse }
  | { statusCode: number; result: VerifySignUpOTPApiSuccessResponse }
  | { statusCode: number; error: ApiErrorResponse };
