import { ApiSuccessResponse } from "@/service/auth/types";

export type BarcodeFormatOption = {
  value: string;
  label: string;
  description: string;
  contentRule: string;
  input: {
    inputMode: "text" | "numeric";
    placeholder: string;
    minLength: number;
    maxLength: number;
    pattern: string;
    uppercase: boolean;
  };
};

export type GenerateBarcodePayload = {
  format: string;
  content: string;
  barWidth: number;
  height: number;
  margin: number;
  barColor: string;
  backgroundColor: string;
  showValue: boolean;
};

export type GetBarcodeFormatsData = {
  formats: BarcodeFormatOption[];
};

export type GetBarcodeFormatsResponse =
  ApiSuccessResponse<GetBarcodeFormatsData>;

export type BarcodeItem = {
  id: string;
  format: string;
  content: string;
  barWidth: number;
  height: number;
  margin: number;
  barColor: string;
  backgroundColor: string;
  showValue: boolean;
  svg: string;
  downloadCounts: { svg: number; png: number };
  totalDownloads: number;
  lastDownloadType: string | null;
  lastDownloadedAt: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

export type GenerateBarcodeData = {
  message: string;
  barcode: BarcodeItem;
};

export type GenerateBarcodeResponse = ApiSuccessResponse<GenerateBarcodeData>;

export type GetBarcodeByIdData = {
  barcode: BarcodeItem;
};

export type GetBarcodeByIdResponse = ApiSuccessResponse<GetBarcodeByIdData>;

export type UpdateBarcodePayload = Partial<GenerateBarcodePayload>;

export type UpdateBarcodeData = {
  message: string;
  barcode: BarcodeItem;
};

export type UpdateBarcodeResponse = ApiSuccessResponse<UpdateBarcodeData>;

export type BarcodePagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
};

export type GetUserBarcodesData = {
  items: BarcodeItem[];
  pagination: BarcodePagination;
};

export type GetUserBarcodesResponse = ApiSuccessResponse<GetUserBarcodesData>;

export type DeleteBarcodeData = {
  message: string;
};

export type DeleteBarcodeResponse = ApiSuccessResponse<DeleteBarcodeData>;

export type BarcodeFormatDistribution = {
  format: string;
  count: number;
  percentage: number;
};

export type BarcodeAnalyticsSummary = {
  generated: number;
  downloads: number;
  format?: number;
  formatDistribution?: BarcodeFormatDistribution[];
  downloadFormatDistribution?: {
    svg: number;
    png: number;
  };
};

export type BarcodeFormatMix = {
  generated: number;
  formatDistribution: BarcodeFormatDistribution[];
  downloadFormatDistribution: {
    svg: number;
    png: number;
  };
};

export type GetBarcodeAnalyticsSummaryResponse =
  ApiSuccessResponse<BarcodeAnalyticsSummary>;

export type GetBarcodeFormatMixResponse = ApiSuccessResponse<BarcodeFormatMix>;

export type BarcodeActivityPeriod = "week" | "month" | "year";

export type BarcodeActivityPoint = {
  label: string;
  count: number;
};

export type BarcodeActivity = {
  period: BarcodeActivityPeriod;
  selectedDate: string;
  start: string;
  end: string;
  growth: number;
  points: BarcodeActivityPoint[];
};

export type GetBarcodeActivityResponse = ApiSuccessResponse<BarcodeActivity>;
