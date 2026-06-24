export type RecentBarcode = {
  id: string;
  format: string;
  content: string;
  svg: string;
  totalDownloads: number;
  downloadCounts: { svg: number; png: number };
  createdAt: string | null;
};
