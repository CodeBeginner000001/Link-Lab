import type { QrCodeDocument } from 'src/models/qr-code.schema';
import { QrContentType, QrStatus } from './qr-code.enums';

export interface SerializedQrCode {
  id: string;
  publicId: string;
  userId: string;
  contentType: QrContentType;
  contentMeta: {
    type: QrContentType;
  };
  content: string;
  style: QrCodeDocument['style'];
  generated: {
    qrValue: string | null;
  };
  exports: QrCodeDocument['exports'];
  tracking: QrCodeDocument['tracking'];
  status: QrStatus;
  deletedAt: Date | null;
  lastActivityAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

export interface QrDashboardSummary {
  totalQrCount: number;
  totalScanCount: number;
  totalExportCount: number;
}

export interface QrDashboardItem {
  publicId: string;
  contentType: QrContentType;
  content: string;
  createdAt: Date | null;
  activity: {
    totalScanCount: number;
    totalExportCount: number;
    lastScannedAt: Date | null;
    lastExportedAt: Date | null;
  };
  style: QrCodeDocument['style'];
  exportsByType: {
    png: number;
    jpg: number;
    jpeg: number;
    svg: number;
    webp: number;
    pdf: number;
  };
  tracking: {
    isTraceable: boolean;
    totalScanCount: number;
  };
}

export interface QrDashboardMostEngagedRecord {
  content: string;
  contentType: QrContentType;
  totalScanCount: number;
  totalExportCount: number;
  createdAt: Date | null;
}

export interface QrDashboardLatestSavedRecord {
  content: string;
  contentType: QrContentType;
  bodyShape: QrCodeDocument['style']['bodyShape'];
  eyeFrameShape: QrCodeDocument['style']['eyeFrameShape'];
  eyeBallShape: QrCodeDocument['style']['eyeBallShape'];
  zoom: QrCodeDocument['style']['zoom'];
  createdAt: Date | null;
}

export interface QrDashboardOverview {
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

export interface ParsedDashboardCursor {
  createdAt: Date;
  publicId: string;
}

export interface AnalyticsCountByContentType {
  type: QrContentType;
  count: number;
}

export interface AnalyticsCountByBodyStyle {
  bodyShape: QrCodeDocument['style']['bodyShape'];
  count: number;
}

export type AnalyticsTopValue<T extends string> = {
  value: T;
  count: number;
};

export interface QrDashboardAnalyticsSummary {
  totalQrCount: number;
  totalScanCount: number;
  totalExportCount: number;
  topBodyStyle: AnalyticsTopValue<QrCodeDocument['style']['bodyShape']> | null;
  topContentType: AnalyticsTopValue<QrContentType> | null;
  contentTypeCounts: AnalyticsCountByContentType[];
  bodyStyleCounts: AnalyticsCountByBodyStyle[];
}
