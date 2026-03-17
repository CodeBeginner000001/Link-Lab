export interface SuccessResponse<T = any> {
  success: true;
  statusCode: number;
  message: string;
  data: T;
  timeStamp: string;
  path: string;
}

export interface ErrorResponse {
  success: false;
  statusCode: number;
  message: string | string[];
  error: string;
  timeStamp: string;
  path: string;
}
