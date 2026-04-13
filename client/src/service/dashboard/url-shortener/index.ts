import { BACKEND_API_URL_ENV } from "@/config/api";
import { requestWithRefresh } from "@/service/request-with-refresh";
import {
  CreateShortUrlResponse,
  DeleteShortUrlResponse,
  GetUserShortUrlsResponse,
} from "./type";

const PROXY_BASE = "/api/features";
const BACKEND_BASE = BACKEND_API_URL_ENV;


export const CreateShortUrl = async (longUrl: string, customAlias?: string) => {
  const body: { longUrl: string; customAlias?: string } = { longUrl };
  if (customAlias?.trim()) body.customAlias = customAlias.trim();

  return requestWithRefresh<CreateShortUrlResponse>({
    baseUrl: PROXY_BASE,
    path: "/short-urls",
    init: {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  });
};

// Server-side only — called from a server component with the forwarded Cookie header
export const GetUserShortUrls = async (headers?: HeadersInit) => {
  return requestWithRefresh<GetUserShortUrlsResponse>({
    baseUrl: BACKEND_BASE,
    path: "/short-urls",
    init: {
      method: "GET",
      headers,
      cache: "no-store",
    },
  });
};

export const DeleteShortUrl = async (id: string) => {
  return requestWithRefresh<DeleteShortUrlResponse>({
    baseUrl: PROXY_BASE,
    path: `/short-urls/${id}`,
    init: { method: "DELETE" },
  });
};
