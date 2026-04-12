// src/services/api/requestWithRefresh.ts
import { BACKEND_API_URL_ENV } from "@/config/api";
import { ApiErrorResponse } from "./auth/types";

const BACKEND_API_URL = BACKEND_API_URL_ENV;

export type ApiResult<T> =
  | { statusCode: number; result: T }
  | { statusCode: number; error: ApiErrorResponse };

type RequestWithRefreshOptions = {
  path: string;
  init?: RequestInit;
  retry?: boolean;
};

const createServiceUnavailableError = (path: string): ApiErrorResponse => ({
  success: false,
  statusCode: 503,
  message: ["Server unreachable. Please try again later."],
  error: "Service Unavailable",
  timeStamp: new Date().toISOString(),
  path,
});

let refreshPromise: Promise<boolean> | null = null;

const safeJson = async <T>(response: Response): Promise<T | null> => {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
};

const getErrorMessage = (error: ApiErrorResponse | null): string | null => {
  if (!error) {
    return null;
  }

  return Array.isArray(error.message)
    ? error.message[0] ?? null
    : error.message ?? null;
};

const shouldRefreshToken = (
  status: number,
  error: ApiErrorResponse | null,
): boolean => {
  if (status !== 401 || !error) {
    return false;
  }

  const message = getErrorMessage(error)?.toLowerCase() ?? "";

  return (
    message.includes("Access token") ||
    message === "unauthorized" ||
    error.error === "Unauthorized"
  );
};

const refreshAccessToken = async (): Promise<boolean> => {
  if (!refreshPromise) {
    refreshPromise = fetch(`${BACKEND_API_URL}/auth/refresh-token`, {
      method: "POST",
      credentials: "include",
    })
      .then((response) => response.ok)
      .catch(() => false)
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

export const requestWithRefresh = async <T>({
  path,
  init,
  retry = true,
}: RequestWithRefreshOptions): Promise<ApiResult<T>> => {
  try {
    const response = await fetch(`${BACKEND_API_URL}${path}`, {
      credentials: "include",
      ...init,
    });

    if (response.ok) {
      const data = await safeJson<T>(response);

      if (data === null) {
        return {
          statusCode: 503,
          error: createServiceUnavailableError(path),
        };
      }

      return {
        statusCode: response.status,
        result: data,
      };
    }

    const error = await safeJson<ApiErrorResponse>(response);

    if (shouldRefreshToken(response.status, error) && retry) {
      const refreshed = await refreshAccessToken();

      if (refreshed) {
        return requestWithRefresh<T>({
          path,
          init,
          retry: false,
        });
      }
    }

    return {
      statusCode: response.status,
      error: error ?? createServiceUnavailableError(path),
    };
  } catch {
    return {
      statusCode: 503,
      error: createServiceUnavailableError(path),
    };
  }
};