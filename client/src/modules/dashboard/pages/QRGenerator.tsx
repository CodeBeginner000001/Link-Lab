import { GetQrDashboardOverview } from "@/service/dashboard/qr-generator";
import { GetQrDashboardOverviewData } from "@/service/dashboard/qr-generator/type";
import { QrCode } from "lucide-react";
import { cookies } from "next/headers";
import QRAnalyticsPanel from "../component/qr-generator/QRAnalyticsPanel";
import QRGeneratorClient from "../component/qr-generator/QRGeneratorClient";
import QRSavedCodesPanel from "../component/qr-generator/QRSavedCodesPanel";
import ToolPageShell from "../component/common/ToolPageShell";
import { isQRContentType, QRContentType } from "../interface/qrGeneratorConfig";

type QRGeneratorProps = {
  searchParams?: {
    type?: string | string[];
  };
};

const EMPTY_OVERVIEW: GetQrDashboardOverviewData = {
  summary: {
    totalQrCount: 0,
    totalScanCount: 0,
    totalExportCount: 0,
  },
  analyticsSummary: {
    totalQrCount: 0,
    totalScanCount: 0,
    totalExportCount: 0,
    topBodyStyle: null,
    topContentType: null,
    contentTypeCounts: [],
    bodyStyleCounts: [],
  },
  mostEngagedRecord: null,
  latestSavedRecords: [],
  items: [],
  pageInfo: {
    nextCursor: null,
    hasNextPage: false,
    limit: 20,
  },
};

const QRGenerator = async ({ searchParams }: QRGeneratorProps) => {
  const cookieStore = await cookies();
  const selectedTypeParam = Array.isArray(searchParams?.type)
    ? searchParams?.type[0]
    : searchParams?.type;

  const initialType: QRContentType =
    selectedTypeParam && isQRContentType(selectedTypeParam)
      ? selectedTypeParam
      : "url";

  const overviewResponse = await GetQrDashboardOverview(
    { Cookie: cookieStore.toString() },
    { limit: 20 },
  );

  const overview =
    "result" in overviewResponse ? overviewResponse.result.data : EMPTY_OVERVIEW;

  return (
    <ToolPageShell
      icon={QrCode}
      heading="QR Code Generator"
      para="Build the QR content and style on the client, save finalized records to the server, and review saved QR history plus analytics below."
      iconClassName="h-6 w-6 text-primary"
    >
      <div className="space-y-6">
        <QRGeneratorClient initialType={initialType} />

        <QRSavedCodesPanel
          items={overview.items}
          totalQrCount={overview.summary.totalQrCount}
          totalScanCount={overview.summary.totalScanCount}
          totalExportCount={overview.summary.totalExportCount}
        />

        <QRAnalyticsPanel overview={overview} />
      </div>
    </ToolPageShell>
  );
};

export default QRGenerator;
