import { requestWithRefresh } from "@/service/request-with-refresh";
import {
  CreateShortUrlResponse,
  DeleteShortUrlResponse,
  GetUserShortUrlsResponse,
} from "./type";

export const CreateShortUrl = async (longUrl: string, customAlias?: string) => {
  const body: { longUrl: string; customAlias?: string } = { longUrl };
  if (customAlias?.trim()) body.customAlias = customAlias.trim();

  return requestWithRefresh<CreateShortUrlResponse>({
    path: "/short-urls",
    init: {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  });
};

export const GetUserShortUrls = async (headers?: HeadersInit) => {
  return requestWithRefresh<GetUserShortUrlsResponse>({
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
    path: `/short-urls/${id}`,
    init: { method: "DELETE" },
  });
};
