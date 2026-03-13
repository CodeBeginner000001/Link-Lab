import QRGenerator from "@/modules/dashboard/pages/QRGenerator";

type QRGeneratorPageProps = {
  searchParams: Promise<{
    type?: string | string[];
  }>;
};

const page = async ({ searchParams }: QRGeneratorPageProps) => {
  const resolvedSearchParams = await searchParams;

  return (
    <>
    <p>dfdfdfffd</p>
      {/* <QRGenerator searchParams={resolvedSearchParams} /> */}
    </>
  );
};

export default page;
