import MotionWrapper from "@/components/common/MotionWrapper";
import { QrCode } from "lucide-react";
import Heading from "../component/common/Heading";
import QRGeneratorClientPanel from "../component/QRGeneratorClientPanel";
import { QRContentType, isQRContentType } from "../interface/qrGeneratorConfig";

const QRGenerator = ({
  searchParams,
}: {
  searchParams?: {
    type?: string;
  };
}) => {
  const selectedTypeParam = searchParams?.type;
  const selectedType: QRContentType =
    selectedTypeParam && isQRContentType(selectedTypeParam)
      ? selectedTypeParam
      : "url";

  return (
    <MotionWrapper>
      <div className="space-y-6">
        <Heading
          icon={QrCode}
          heading="QR Code Generator"
          para="Generate customizable QR codes for URLs, text, email, and more."
          iconClassName="w-6 h-6 text-primary"
        />
        <QRGeneratorClientPanel initialType={selectedType} />
      </div>
    </MotionWrapper>
  );
};

export default QRGenerator;
