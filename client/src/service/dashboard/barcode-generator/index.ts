import { BACKEND_API_URL } from "@/utils/env";
import { requestWithRefresh } from "@/service/request-with-refresh";
import {
  DeleteBarcodeResponse,
  GenerateBarcodePayload,
  GenerateBarcodeResponse,
  GetBarcodeActivityResponse,
  GetBarcodeAnalyticsSummaryResponse,
  GetBarcodeByIdResponse,
  GetBarcodeFormatMixResponse,
  GetBarcodeFormatsResponse,
  GetUserBarcodesResponse,
  BarcodeActivityPeriod,
  UpdateBarcodePayload,
  UpdateBarcodeResponse,
} from "./type";

const PROXY_BASE = "/api/features";
const BACKEND_BASE = BACKEND_API_URL;
const BARCODE_CACHE_TAG = "barcodes";

export const BARCODE_DATA_CHANGED_EVENT = "barcode-data-changed";

export const NotifyBarcodeDataChanged = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(BARCODE_DATA_CHANGED_EVENT));
  }
};

export const GetBarcodeDownloadUrl = (id: string, type: "png" | "svg") =>
  `${PROXY_BASE}/barcodes/${id}/download?type=${type}`;

export const GetBarcodePreviewUrl = (id: string) =>
  `${PROXY_BASE}/barcodes/${id}/preview`;

export const GetBarcodeDownloadFilename = (
  barcode: { id: string; format: string; content: string },
  type: "png" | "svg",
) => {
  const safeContent = barcode.content
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 36);

  const name = safeContent || barcode.id;

  return `linklab-${barcode.format.toLowerCase()}-${name}.${type}`;
};

export const GetBarcodeFormats = async (headers?: HeadersInit) => {
  return requestWithRefresh<GetBarcodeFormatsResponse>({
    baseUrl: BACKEND_BASE,
    path: "/barcodes/formats",
    init: {
      method: "GET",
      headers,
      next: { revalidate: 10 },
    },
  });
};

export const GenerateBarcode = async (payload: GenerateBarcodePayload) => {
  return requestWithRefresh<GenerateBarcodeResponse>({
    baseUrl: PROXY_BASE,
    path: "/barcodes",
    init: {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  });
};

export const GetBarcodeById = async (id: string) => {
  return requestWithRefresh<GetBarcodeByIdResponse>({
    baseUrl: PROXY_BASE,
    path: `/barcodes/${id}`,
    init: { method: "GET", cache: "no-store" },
  });
};

export const UpdateBarcode = async (
  id: string,
  payload: UpdateBarcodePayload,
) => {
  return requestWithRefresh<UpdateBarcodeResponse>({
    baseUrl: PROXY_BASE,
    path: `/barcodes/${id}`,
    init: {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  });
};

export const GetUserBarcodes = async (
  page = 1,
  limit = 10,
  headers?: HeadersInit,
) => {
  return requestWithRefresh<GetUserBarcodesResponse>({
    baseUrl: headers ? BACKEND_BASE : PROXY_BASE,
    path: `/barcodes?page=${page}&limit=${limit}`,
    init: {
      method: "GET",
      headers,
      next: { revalidate: 10, tags: [BARCODE_CACHE_TAG] },
    },
  });
};

export const DeleteBarcode = async (id: string) => {
  return requestWithRefresh<DeleteBarcodeResponse>({
    baseUrl: PROXY_BASE,
    path: `/barcodes/${id}`,
    init: { method: "DELETE" },
  });
};

export const GetBarcodeAnalyticsSummary = async (headers?: HeadersInit) => {
  return requestWithRefresh<GetBarcodeAnalyticsSummaryResponse>({
    baseUrl: headers ? BACKEND_BASE : PROXY_BASE,
    path: "/barcodes/analytics",
    init: {
      method: "GET",
      headers,
      next: { revalidate: 10, tags: [BARCODE_CACHE_TAG] },
    },
  });
};

export const GetBarcodeFormatMix = async (headers?: HeadersInit) => {
  return requestWithRefresh<GetBarcodeFormatMixResponse>({
    baseUrl: headers ? BACKEND_BASE : PROXY_BASE,
    path: "/barcodes/analytics/format-mix",
    init: {
      method: "GET",
      headers,
      next: { revalidate: 10, tags: [BARCODE_CACHE_TAG] },
    },
  });
};

export const GetBarcodeActivity = async (
  period: BarcodeActivityPeriod,
  date: string,
) => {
  return requestWithRefresh<GetBarcodeActivityResponse>({
    baseUrl: PROXY_BASE,
    path: `/barcodes/analytics/activity/${period}/${encodeURIComponent(date)}`,
    init: { method: "GET", cache: "no-store" },
  });
};
