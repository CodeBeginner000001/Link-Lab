import {
  BodyShape,
  EyeBallShape,
  EyeFrameShape,
} from "@/modules/dashboard/interface/qrGeneratorStyle";
import { ApiSuccessResponse } from "@/service/auth/types";
import { QrApiContentType } from "@/modules/dashboard/interface/qrGeneratorConfig";
import { QrPreviewRenderConfig } from "@/modules/dashboard/component/qr-generator/qr-preview-renderer";

export type QrExportType =
  | "PNG"
  | "JPG"
  | "JPEG"
  | "SVG"
  | "WEBP"
  | "PDF"
  | "COPY";
export type QrFileExportType = Exclude<QrExportType, "COPY">;

export const isQrFileExportType = (
  exportType: QrExportType,
): exportType is QrFileExportType => exportType !== "COPY";
export type QrStatus = "ACTIVE" | "DEACTIVATED";

export interface QrCopyAvailability {
  isAvailable: boolean;
  cooldownSeconds: number;
  remainingSeconds: number;
  lastCopiedAt: string | null;
  nextAvailableAt: string | null;
}

export interface QrCodeStyle {
  bodyShape: BodyShape;
  eyeFrameShape: EyeFrameShape;
  eyeBallShape: EyeBallShape;
  zoom: number;
  foreground: string;
  background: string;
}

export interface QrCodeRecord {
  id: string;
  publicId: string;
  userId: string;
  contentType: QrApiContentType;
  contentMeta: {
    type: QrApiContentType;
  };
  content: string;
  style: QrCodeStyle;
  generated: {
    qrValue: string | null;
  };
  exports: {
    totalCount: number;
    byType: {
      png: number;
      jpg: number;
      jpeg: number;
      svg: number;
      webp: number;
      pdf: number;
      copy: number;
    };
    lastExportedAt: string | null;
    lastExportType: QrExportType | null;
    lastCopiedAt: string | null;
  };
  copyAvailability: QrCopyAvailability;
  tracking: {
    isTraceable: boolean;
    traceability: string;
    traceabilityReason: string;
    passesThroughBackend: boolean;
    totalScanCount: number;
    lastScannedAt: string | null;
  };
  status: QrStatus;
  deletedAt: string | null;
  lastActivityAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface CreateQrCodePayload {
  contentType: QrApiContentType;
  content: string;
  style: QrCodeStyle;
}

export interface CreateQrCodeData {
  message: string;
  qrCode: QrCodeRecord;
}
export type CreateQrCodeResponse = ApiSuccessResponse<CreateQrCodeData>;

export interface GetQrCodeDetailData {
  qrCode: QrCodeRecord;
}
export type GetQrCodeDetailResponse = ApiSuccessResponse<GetQrCodeDetailData>;

export interface DeleteQrCodeData {
  message: string;
  deleted: boolean;
  qrCode: QrCodeRecord;
}
export type DeleteQrCodeResponse = ApiSuccessResponse<DeleteQrCodeData>;

export interface QrDashboardItem {
  publicId: string;
  contentType: QrApiContentType;
  content: string;
  createdAt: string | null;
  activity: {
    totalScanCount: number;
    totalExportCount: number;
    lastScannedAt: string | null;
    lastExportedAt: string | null;
  };
  style: QrCodeStyle;
  exportsByType: {
    png: number;
    jpg: number;
    jpeg: number;
    svg: number;
    webp: number;
    pdf: number;
    copy: number;
  };
  copyAvailability: QrCopyAvailability;
  tracking: {
    isTraceable: boolean;
    totalScanCount: number;
  };
}

export interface QrDashboardSummary {
  totalQrCount: number;
  totalScanCount: number;
  totalExportCount: number;
}

export interface QrDashboardAnalyticsSummary {
  totalQrCount: number;
  totalScanCount: number;
  totalExportCount: number;
  topBodyStyle: {
    value: BodyShape;
    count: number;
  } | null;
  topContentType: {
    value: QrApiContentType;
    count: number;
  } | null;
  contentTypeCounts: Array<{
    type: QrApiContentType;
    count: number;
  }>;
  bodyStyleCounts: Array<{
    bodyShape: BodyShape;
    count: number;
  }>;
}

export interface QrDashboardMostEngagedRecord {
  content: string;
  contentType: QrApiContentType;
  totalScanCount: number;
  totalExportCount: number;
  createdAt: string | null;
}

export interface QrDashboardLatestSavedRecord {
  content: string;
  contentType: QrApiContentType;
  bodyShape: BodyShape;
  eyeFrameShape: EyeFrameShape;
  eyeBallShape: EyeBallShape;
  zoom: number;
  createdAt: string | null;
}

export interface GetQrDashboardOverviewData {
  summary: QrDashboardSummary;
  analyticsSummary: QrDashboardAnalyticsSummary;
  mostEngagedRecord: QrDashboardMostEngagedRecord | null;
  latestSavedRecords: QrDashboardLatestSavedRecord[];
  items: QrDashboardItem[];
  pageInfo: {
    nextCursor: string | null;
    hasNextPage: boolean;
    limit: number;
  };
}
export type GetQrDashboardOverviewResponse =
  ApiSuccessResponse<GetQrDashboardOverviewData>;

export interface GetQrDashboardOverviewQuery {
  cursor?: string;
  limit?: number;
  type?: QrApiContentType;
  bodyShape?: BodyShape;
  search?: string;
}

export interface ExportQrCodePayload {
  exportType: QrExportType;
  render?: QrPreviewRenderConfig;
}

export type ExportQrCodeResult =
  | {
      kind: "file";
      blob: Blob;
      contentType: string;
      filename: string | null;
    }
  | {
      kind: "copy";
      content: string;
      copiedAt: string;
      nextCopyAvailableAt: string;
      cooldownSeconds: number;
      remainingSeconds: number;
      isCopyAvailable: boolean;
    };
