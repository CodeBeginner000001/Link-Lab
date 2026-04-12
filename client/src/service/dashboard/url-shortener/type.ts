import { ApiSuccessResponse } from "@/service/auth/types";

export enum ShortUrlStatus {
  ACTIVE = "active",
  DISABLED = "disabled",
}

export interface ShortUrlItem {
  id: string;
  alias: string;
  longUrl: string;
  shortUrl: string;
  status: ShortUrlStatus;
  clicksPersisted: number;
  pendingClicks: number;
  totalClicks: number;
  lastClickedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

// POST /v1/short-urls
export interface CreateShortUrlData {
  message: string;
  shortUrl: ShortUrlItem;
}
export type CreateShortUrlResponse = ApiSuccessResponse<CreateShortUrlData>;

// GET /v1/short-urls
export interface GetUserShortUrlsData {
  total: number;
  items: ShortUrlItem[];
}
export type GetUserShortUrlsResponse = ApiSuccessResponse<GetUserShortUrlsData>;

// DELETE /v1/short-urls/:id
export interface DeleteShortUrlData {
  message: string;
  deleted: boolean;
  flushedPendingClicks: number;
  shortUrl: ShortUrlItem;
}
export type DeleteShortUrlResponse = ApiSuccessResponse<DeleteShortUrlData>;
