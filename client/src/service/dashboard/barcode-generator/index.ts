import { BACKEND_API_URL_ENV } from "@/config/api";
import { requestWithRefresh } from "@/service/request-with-refresh";
import {
  DeleteBarcodeResponse,
  GenerateBarcodePayload,
  GenerateBarcodeResponse,
  GetBarcodeActivityResponse,
  GetBarcodeAnalyticsSummaryResponse,
  GetBarcodeFormatsResponse,
  GetUserBarcodesResponse,
  BarcodeActivityPeriod,
} from "./type";

const PROXY_BASE = "/api/features";
const BACKEND_BASE = BACKEND_API_URL_ENV;

export const BARCODE_DATA_CHANGED_EVENT = "barcode-data-changed";

export const NotifyBarcodeDataChanged = () => {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(BARCODE_DATA_CHANGED_EVENT));
  }
};

export const GetBarcodeDownloadUrl = (id: string, type: "png" | "svg") =>
  `${PROXY_BASE}/barcodes/${id}/download?type=${type}`;

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
      cache: "no-store",
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

export const GetUserBarcodes = async (page = 1, limit = 10) => {
  return requestWithRefresh<GetUserBarcodesResponse>({
    baseUrl: PROXY_BASE,
    path: `/barcodes/recent?page=${page}&limit=${limit}`,
    init: { method: "GET", cache: "no-store" },
  });
};

export const DeleteBarcode = async (id: string) => {
  return requestWithRefresh<DeleteBarcodeResponse>({
    baseUrl: PROXY_BASE,
    path: `/barcodes/${id}`,
    init: { method: "DELETE" },
  });
};

export const GetBarcodeAnalyticsSummary = async () => {
  return requestWithRefresh<GetBarcodeAnalyticsSummaryResponse>({
    baseUrl: PROXY_BASE,
    path: "/barcodes/analytics/summary",
    init: { method: "GET", cache: "no-store" },
  });
};

export const GetBarcodeActivity = async (
  period: BarcodeActivityPeriod,
  date: string,
) => {
  const query = new URLSearchParams({ period, date });

  return requestWithRefresh<GetBarcodeActivityResponse>({
    baseUrl: PROXY_BASE,
    path: `/barcodes/analytics/activity?${query.toString()}`,
    init: { method: "GET", cache: "no-store" },
  });
};
