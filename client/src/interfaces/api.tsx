export interface ApiErrorResponse {
  success: false;
  statusCode: number;
  message: string[];
  error: string;
  timeStamp: string;
  path: string;
}

export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
  timeStamp: string;
  path: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
}

export interface SignUpApiDataResponse {
  message: string;
  email: string;
  expiresInMinutes: number;
  resendCooldownSeconds: number;
  signupSessionExpiresInMinutes: number;
}

export type SignUpApiSuccessResponse = ApiSuccessResponse<SignUpApiDataResponse>;

export interface GetSessionDataApiDataResponse {
  email: string;
  otpExpiresAt: number;
}

export type GetSessionDataApiSuccessResponse = ApiSuccessResponse<GetSessionDataApiDataResponse>

export interface GetCurrentUserApiDataResponse {
  user: AuthUser;
}

export type GetCurrentUserApiSuccessResponse =
  ApiSuccessResponse<GetCurrentUserApiDataResponse>;

export interface RefreshAccessTokenApiDataResponse {
  accessToken: string;
  user: AuthUser;
}

export type RefreshAccessTokenApiSuccessResponse =
  ApiSuccessResponse<RefreshAccessTokenApiDataResponse>;

export interface ResendOTPApiDataResponse {
  message: string;
  otpExpiresAt: number;
}

export type ResendOTPApiSuccessResponse = ApiSuccessResponse<ResendOTPApiDataResponse>
///////////////////////////////////////////////////////
export interface LoginApiDataResponse {
  message: string;
  user: AuthUser;
}

export type LoginApiSuccessResponse = ApiSuccessResponse<LoginApiDataResponse>;

export interface VerifySignUpOTPApiDataResponse {
  accessToken: string;
  refreshToken: string;
  message: string;
}

export type VerifySignUpOTPApiSuccessResponse = ApiSuccessResponse<VerifySignUpOTPApiDataResponse>;


export type CustomErrorApiResponse =
  | { statusCode: number; result: SignUpApiSuccessResponse }
  | { statusCode: number; result: LoginApiSuccessResponse }
  | { statusCode: number; result: ResendOTPApiSuccessResponse }
  | { statusCode: number; result: VerifySignUpOTPApiSuccessResponse }
  | { statusCode: number; error: ApiErrorResponse };
