const FALLBACK_BACKEND_API_URL = "http://localhost:4000/v1";

const normalizeBackendApiUrl = (value: string) =>
  value.trim().replace(/\/+$/, "");

export const BACKEND_API_URL = normalizeBackendApiUrl(
  process.env.NEXT_PUBLIC_BACKEND_URL || FALLBACK_BACKEND_API_URL,
);
