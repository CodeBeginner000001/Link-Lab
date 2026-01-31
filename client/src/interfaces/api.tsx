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
  sessionId: string;
  message: string;
}

export type SignUpApiSuccessResponse = {
  success: boolean;
  message: string;
  data: SignUpApiDataResponse
}

export type SignUpApiResponse = | {statusCode: number, result: SignUpApiSuccessResponse} | {statusCode: number, error: ApiErrorResponse} 