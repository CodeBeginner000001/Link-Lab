import { BACKEND_API_URL_ENV } from "@/config/api";
import { ApiErrorResponse } from "@/service/auth/types";
import { requestWithRefresh } from "@/service/request-with-refresh";
import {
  CreateQrCodePayload,
  CreateQrCodeResponse,
  DeleteQrCodeResponse,
  ExportQrCodePayload,
  ExportQrCodeResult,
  GetQrCodeDetailResponse,
  GetQrDashboardOverviewQuery,
  GetQrDashboardOverviewResponse,
  QrFileExportType,
  QrExportType,
} from "./type";

const PROXY_BASE = "/api/features";
const BACKEND_BASE = BACKEND_API_URL_ENV;
const REFRESH_PATH = "/api/auth/backend/refresh-token";

const getSearchParams = (query?: GetQrDashboardOverviewQuery) => {
  if (!query) {
    return "";
  }

  const params = new URLSearchParams();

  if (query.cursor) {
    params.set("cursor", query.cursor);
  }

  if (query.limit) {
    params.set("limit", String(query.limit));
  }

  if (query.type) {
    params.set("type", query.type);
  }

  if (query.bodyShape) {
    params.set("bodyShape", query.bodyShape);
  }

  if (query.search) {
    params.set("search", query.search);
  }

  const search = params.toString();

  return search ? `?${search}` : "";
};

const parseExportError = async (response: Response) => {
  try {
    const payload = (await response.json()) as ApiErrorResponse & {
      nextAvailableAt?: string;
      remainingSeconds?: number;
    };
    const message = payload.message;

    return {
      error: Array.isArray(message)
        ? (message[0] ?? "Unable to complete QR request.")
        : typeof message === "string"
          ? message
          : "Unable to complete QR request.",
      nextCopyAvailableAt:
        typeof payload.nextAvailableAt === "string"
          ? payload.nextAvailableAt
          : undefined,
      remainingSeconds:
        typeof payload.remainingSeconds === "number"
          ? payload.remainingSeconds
          : undefined,
    };
  } catch {
    return {
      error: "Unable to complete QR request.",
    };
  }
};

const getFilename = (disposition: string | null) => {
  if (!disposition) {
    return null;
  }

  const match = disposition.match(/filename="([^"]+)"/i);

  return match?.[1] ?? null;
};

const runExportRequest = async (
  publicId: string,
  payload: ExportQrCodePayload,
  retry = true,
): Promise<ExportQrCodeResult | ExportQrCodeError> => {
  const response = await fetch(`${PROXY_BASE}/qr-codes/${publicId}/export`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (response.status === 401 && retry) {
    const refreshResponse = await fetch(REFRESH_PATH, {
      method: "POST",
      credentials: "include",
    });

    if (refreshResponse.ok) {
      return runExportRequest(publicId, payload, false);
    }
  }

  if (!response.ok) {
    return parseExportError(response);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    const payload = (await response.json()) as {
      content?: string;
      copiedAt?: string;
      nextCopyAvailableAt?: string;
      cooldownSeconds?: number;
      remainingSeconds?: number;
      isCopyAvailable?: boolean;
    };

    return {
      kind: "copy",
      content: payload.content ?? "",
      copiedAt: payload.copiedAt ?? new Date().toISOString(),
      nextCopyAvailableAt:
        payload.nextCopyAvailableAt ??
        new Date(Date.now() + 2 * 60 * 1000).toISOString(),
      cooldownSeconds: payload.cooldownSeconds ?? 120,
      remainingSeconds: payload.remainingSeconds ?? 120,
      isCopyAvailable: payload.isCopyAvailable ?? false,
    };
  }

  return {
    kind: "file",
    blob: await response.blob(),
    contentType,
    filename: getFilename(response.headers.get("content-disposition")),
  };
};

export const CreateQrCode = async (payload: CreateQrCodePayload) => {
  return requestWithRefresh<CreateQrCodeResponse>({
    baseUrl: PROXY_BASE,
    path: "/qr-codes",
    init: {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  });
};

export const GetQrDashboardOverview = async (
  headers?: HeadersInit,
  query?: GetQrDashboardOverviewQuery,
) => {
  return requestWithRefresh<GetQrDashboardOverviewResponse>({
    baseUrl: BACKEND_BASE,
    path: `/qr-codes/dashboard/overview${getSearchParams(query)}`,
    init: {
      method: "GET",
      headers,
      cache: "no-store",
    },
  });
};

export const GetQrCodeDetail = async (
  publicId: string,
  headers?: HeadersInit,
) => {
  return requestWithRefresh<GetQrCodeDetailResponse>({
    baseUrl: BACKEND_BASE,
    path: `/qr-codes/${publicId}`,
    init: {
      method: "GET",
      headers,
      cache: "no-store",
    },
  });
};

export const GetQrCodeDetailFromProxy = async (publicId: string) => {
  return requestWithRefresh<GetQrCodeDetailResponse>({
    baseUrl: PROXY_BASE,
    path: `/qr-codes/${publicId}`,
    init: {
      method: "GET",
      cache: "no-store",
    },
  });
};

export const DeleteQrCode = async (id: string) => {
  return requestWithRefresh<DeleteQrCodeResponse>({
    baseUrl: PROXY_BASE,
    path: `/qr-codes/${id}`,
    init: {
      method: "DELETE",
    },
  });
};

export const ExportQrCode = async (
  publicId: string,
  exportType: QrExportType,
  render?: ExportQrCodePayload["render"],
) => {
  try {
    return await runExportRequest(publicId, {
      exportType,
      render,
    });
  } catch {
    return {
      error: "Unable to export QR code.",
    };
  }
};

export const getQrExportDownloadUrl = (
  publicId: string,
  exportType: QrFileExportType,
  render?: ExportQrCodePayload["render"],
) => {
  const params = new URLSearchParams({
    exportType,
  });

  if (render) {
    params.set("width", String(render.width));
    params.set("height", String(render.height));
    params.set("previewModules", String(render.previewModules));
    params.set("moduleSize", String(render.moduleSize));
    params.set("qrSize", String(render.qrSize));
    params.set("offsetX", String(render.offsetX));
    params.set("offsetY", String(render.offsetY));
    params.set("cornerRadius", String(render.cornerRadius));
  }

  return `${PROXY_BASE}/qr-codes/${publicId}/export?${params.toString()}`;
};

export type ExportQrCodeError = {
  error: string;
  nextCopyAvailableAt?: string;
  remainingSeconds?: number;
};
