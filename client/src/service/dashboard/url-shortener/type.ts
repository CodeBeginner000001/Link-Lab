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

export type ShortUrlPagination = {
  page: number;
  limit: number;
  totalItems?: number;
  total?: number;
  totalPages: number;
  hasMore: boolean;
  cursor?: string | null;
};

// POST /v1/short-urls
export interface CreateShortUrlData {
  message: string;
  shortUrl: ShortUrlItem;
}
export type CreateShortUrlResponse = ApiSuccessResponse<CreateShortUrlData>;

// GET /v1/short-urls
export interface GetUserShortUrlsData {
  items: ShortUrlItem[];
  pagination?: ShortUrlPagination;
  total?: number;
}
export type GetUserShortUrlsResponse = ApiSuccessResponse<GetUserShortUrlsData>;

// GET /v1/short-urls/analytics
export interface ShortUrlAnalyticsData {
  total: number;
  totalClicks: number;
  topAlias: string | null;
}
export type GetShortUrlAnalyticsResponse =
  ApiSuccessResponse<ShortUrlAnalyticsData>;

// GET /v1/short-urls/:id
export interface GetShortUrlByIdData {
  shortUrl: ShortUrlItem;
}
export type GetShortUrlByIdResponse = ApiSuccessResponse<GetShortUrlByIdData>;

// PUT /v1/short-urls/:id
export type UpdateShortUrlPayload = {
  longUrl?: string;
  customAlias?: string;
};
export interface UpdateShortUrlData {
  message: string;
  shortUrl: ShortUrlItem;
}
export type UpdateShortUrlResponse = ApiSuccessResponse<UpdateShortUrlData>;

// DELETE /v1/short-urls/:id
export interface DeleteShortUrlData {
  message: string;
  deleted: boolean;
  flushedPendingClicks: number;
  shortUrl: ShortUrlItem;
}
export type DeleteShortUrlResponse = ApiSuccessResponse<DeleteShortUrlData>;
