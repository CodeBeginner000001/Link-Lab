import { BACKEND_API_URL } from "@/utils/env";
import { requestWithRefresh } from "@/service/request-with-refresh";
import {
  CreateShortUrlResponse,
  DeleteShortUrlResponse,
  GetShortUrlAnalyticsResponse,
  GetShortUrlByIdResponse,
  GetUserShortUrlsResponse,
  UpdateShortUrlPayload,
  UpdateShortUrlResponse,
} from "./type";

const PROXY_BASE = "/api/features";
const BACKEND_BASE = BACKEND_API_URL;
const SHORT_URL_CACHE_TAG = "short-urls";


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
export const GetUserShortUrls = async (
  headers?: HeadersInit,
  page = 1,
  limit = 10,
) => {
  return requestWithRefresh<GetUserShortUrlsResponse>({
    baseUrl: BACKEND_BASE,
    path: `/short-urls?page=${page}&limit=${limit}`,
    init: {
      method: "GET",
      headers,
      next: { revalidate: 10, tags: [SHORT_URL_CACHE_TAG] },
    },
  });
};

export const GetShortUrlAnalytics = async (headers?: HeadersInit) => {
  return requestWithRefresh<GetShortUrlAnalyticsResponse>({
    baseUrl: headers ? BACKEND_BASE : PROXY_BASE,
    path: "/short-urls/analytics",
    init: {
      method: "GET",
      headers,
      next: { revalidate: 10, tags: [SHORT_URL_CACHE_TAG] },
    },
  });
};

export const GetShortUrlById = async (id: string) => {
  return requestWithRefresh<GetShortUrlByIdResponse>({
    baseUrl: PROXY_BASE,
    path: `/short-urls/${id}`,
    init: { method: "GET", cache: "no-store" },
  });
};

export const UpdateShortUrl = async (
  id: string,
  payload: UpdateShortUrlPayload,
) => {
  return requestWithRefresh<UpdateShortUrlResponse>({
    baseUrl: PROXY_BASE,
    path: `/short-urls/${id}`,
    init: {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
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
