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
}

export interface VerifySignUpOTPApiDataResponse {
  accessToken: string;
  refreshToken: string;
  message: string;
}

export interface ResendOTPApiDataResponse {
  message: string;
  otpExpiresAt: number;
}

export interface GetSessionDataApiDataResponse {
  email: string;
  otpExpiresAt: number;
}

export interface GetCurrentUserApiDataResponse {
  user: AuthUser;
}

export interface RefreshAccessTokenApiDataResponse {
  accessToken: string;
  message: string;
}

export interface LoginApiDataResponse {
  message: string;
  user: AuthUser;
}
export interface VerifyForgetPasswordOTPApiDataResponse {
  resetTokenExpiresInMintues: number;
  message: string;
}

export type SignUpApiSuccessResponse = ApiSuccessResponse<SignUpApiDataResponse>;
export type GetSessionDataApiSuccessResponse = ApiSuccessResponse<GetSessionDataApiDataResponse>
export type GetCurrentUserApiSuccessResponse =
  ApiSuccessResponse<GetCurrentUserApiDataResponse>;
export type RefreshAccessTokenApiSuccessResponse =
  ApiSuccessResponse<RefreshAccessTokenApiDataResponse>;
export type ResendOTPApiSuccessResponse = ApiSuccessResponse<ResendOTPApiDataResponse>
export type LoginApiSuccessResponse = ApiSuccessResponse<LoginApiDataResponse>;
export type VerifySignUpOTPApiSuccessResponse = ApiSuccessResponse<VerifySignUpOTPApiDataResponse>;
export type VerifyForgetPasswordOTPApiSuccessResponse = ApiSuccessResponse<VerifyForgetPasswordOTPApiDataResponse>;


export type CustomErrorApiResponse =
  | { statusCode: number; result: SignUpApiSuccessResponse }
  | { statusCode: number; result: LoginApiSuccessResponse }
  | { statusCode: number; result: ResendOTPApiSuccessResponse }
  | { statusCode: number; result: VerifySignUpOTPApiSuccessResponse }
  | { statusCode: number; result: VerifyForgetPasswordOTPApiSuccessResponse }
  | { statusCode: number; error: ApiErrorResponse };
