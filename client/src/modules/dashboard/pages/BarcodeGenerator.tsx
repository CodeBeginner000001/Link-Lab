import { Barcode } from "lucide-react";
import { cookies } from "next/headers";
import { GetBarcodeFormats } from "@/service/dashboard/barcode-generator";
import BarcodeAnalyticsPanel from "../component/barcode-generator/BarcodeAnalyticsPanel";
import BarcodeGeneratorWorkspace from "../component/barcode-generator/BarcodeGeneratorWorkspace";
import RecentBarcodesPanel from "../component/barcode-generator/RecentBarcodesPanel";
import ToolPageShell from "../component/common/ToolPageShell";

export default async function BarcodeGenerator() {
  const cookieStore = await cookies();
  const response = await GetBarcodeFormats({
    Cookie: cookieStore.toString(),
  });
  const formats =
    "result" in response ? (response.result.data.formats ?? []) : [];

  return (
    <ToolPageShell
      icon={Barcode}
      heading="Barcode Generator"
      para="Design barcodes, preview the result, and review usage analytics."
      headingClassName="text-xl max-[350px]:text-lg sm:text-2xl"
      iconClassName="h-6 w-6 shrink-0 text-[hsl(var(--primary))] max-[350px]:h-5 max-[350px]:w-5"
      paraClassName="text-sm max-[350px]:text-xs max-[350px]:leading-5 sm:text-base"
    >
      <BarcodeGeneratorWorkspace formats={formats} />

      <BarcodeAnalyticsPanel />
      <RecentBarcodesPanel />
    </ToolPageShell>
  );
}
