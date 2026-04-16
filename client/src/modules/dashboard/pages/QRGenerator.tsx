import QRGeneratorClient from "../component/qr-generator/QRGeneratorClient";

type QRGeneratorProps = {
  searchParams?: {
    type?: string | string[];
  };
};

export default function QRGenerator({ searchParams }: QRGeneratorProps) {
  return <QRGeneratorClient searchParams={searchParams} />;
}
