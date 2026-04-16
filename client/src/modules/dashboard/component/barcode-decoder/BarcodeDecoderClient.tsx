// "use client";

// import { Button } from "@/components/ui/Button";
// import { useToastNotification } from "@/utils/toast";
// import { BarChart3, Copy, FileCode, History, Upload } from "lucide-react";
// import Image from "next/image";
// import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
// import ToolEmptyState from "../common/ToolEmptyState";
// import ToolFeaturePill from "../common/ToolFeaturePill";
// import ToolInfoCard from "../common/ToolInfoCard";
// import ToolLoadingState from "../common/ToolLoadingState";
// import ToolMetricCard from "../common/ToolMetricCard";
// import ToolPageShell from "../common/ToolPageShell";
// import ToolPanel from "../common/ToolPanel";
// import ToolPillGroup from "../common/ToolPillGroup";
// import ToolUploadZone from "../common/ToolUploadZone";
// import {
//   DASHBOARD_STORAGE_KEYS,
//   formatDashboardDate,
//   readStoredCollection,
//   truncateDashboardValue,
//   writeStoredCollection,
// } from "../../lib/toolStorage";

// type DecodedResult = {
//   barcodeType: string;
//   value: string;
// };

// type DecodedRecord = DecodedResult & {
//   id: string;
//   createdAt: string;
// };

// const MOCK_RESULTS: DecodedResult[] = [
//   { barcodeType: "CODE128", value: "ABC123456789" },
//   { barcodeType: "EAN-13", value: "5901234123457" },
//   { barcodeType: "UPC-A", value: "012345678905" },
//   { barcodeType: "CODE39", value: "PRODUCT-001" },
// ];

// const BarcodeDecoder = () => {
//   const notify = useToastNotification();
//   const fileInputRef = useRef<HTMLInputElement>(null);
//   const [isScanning, setIsScanning] = useState(false);
//   const [previewImage, setPreviewImage] = useState<string | null>(null);
//   const [decodedResult, setDecodedResult] = useState<DecodedResult | null>(null);
//   const [decodedHistory, setDecodedHistory] = useState<DecodedRecord[]>(() =>
//     readStoredCollection<DecodedRecord>(DASHBOARD_STORAGE_KEYS.barcodeDecoder),
//   );

//   useEffect(() => {
//     writeStoredCollection(DASHBOARD_STORAGE_KEYS.barcodeDecoder, decodedHistory);
//   }, [decodedHistory]);

//   const analytics = useMemo(() => {
//     const byType = decodedHistory.reduce<Record<string, number>>((accumulator, record) => {
//       accumulator[record.barcodeType] = (accumulator[record.barcodeType] ?? 0) + 1;
//       return accumulator;
//     }, {});

//     const topTypeEntry = Object.entries(byType).sort((firstEntry, secondEntry) => {
//       return secondEntry[1] - firstEntry[1];
//     })[0];

//     return {
//       totalDecoded: decodedHistory.length,
//       uniqueFormats: Object.keys(byType).length,
//       topFormat: topTypeEntry?.[0] ?? "N/A",
//       byType,
//       latestRecord: decodedHistory[0] ?? null,
//     };
//   }, [decodedHistory]);

//   const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0];
//     if (!file) {
//       return;
//     }

//     const reader = new FileReader();
//     reader.onload = async (loadEvent) => {
//       setPreviewImage(loadEvent.target?.result as string);
//       setDecodedResult(null);
//       setIsScanning(true);

//       await new Promise((resolve) => setTimeout(resolve, 1050));
//       const nextResult =
//         MOCK_RESULTS[Math.floor(Math.random() * MOCK_RESULTS.length)];
//       const nextRecord: DecodedRecord = {
//         id: crypto.randomUUID(),
//         ...nextResult,
//         createdAt: new Date().toISOString(),
//       };

//       setDecodedResult(nextResult);
//       setDecodedHistory((previousRecords) => [nextRecord, ...previousRecords].slice(0, 24));
//       setIsScanning(false);
//       notify("Barcode decoded.", "success");
//     };

//     reader.onerror = () => {
//       notify("Unable to read the selected image.", "error");
//     };

//     reader.readAsDataURL(file);
//   };

//   const copyValue = async (value: string) => {
//     try {
//       await navigator.clipboard.writeText(value);
//       notify("Decoded content copied.", "success");
//     } catch {
//       notify("Unable to copy the decoded value.", "error");
//     }
//   };

//   return (
//     <ToolPageShell
//       icon={FileCode}
//       heading="Barcode Decoder"
//       para="Scan and decode barcode formats from uploaded images."
//       iconClassName="h-6 w-6 text-primary"
//     >
//       <div className="space-y-6">
//         <div className="grid gap-6 xl:grid-cols-[minmax(0,0.96fr)_minmax(0,1.04fr)]">
//           <ToolPanel
//             heading="Upload Barcode"
//             para="Choose an image containing a barcode and the decoder will extract its format and value."
//             headerSlot={<ToolFeaturePill icon={Upload} label="Image upload" />}
//           >
//             <ToolPillGroup className="mb-5">
//               <ToolFeaturePill icon={FileCode} label="Decode image barcodes" />
//               <ToolFeaturePill icon={Upload} label="Preview before scan" />
//               <ToolFeaturePill icon={Copy} label="Copy result" />
//             </ToolPillGroup>

//             <input
//               ref={fileInputRef}
//               type="file"
//               accept="image/*"
//               onChange={handleFileUpload}
//               className="hidden"
//             />

//             <ToolUploadZone
//               icon={Upload}
//               title="Drop image here or click to upload"
//               description="Upload JPG, PNG, or GIF files containing a barcode."
//               hint="Image preview supported"
//               onClick={() => fileInputRef.current?.click()}
//               preview={
//                 previewImage ? (
//                   <div className="relative h-[220px] w-full overflow-hidden rounded-2xl">
//                     <Image
//                       src={previewImage}
//                       alt="Barcode preview"
//                       fill
//                       unoptimized
//                       className="object-contain"
//                     />
//                   </div>
//                 ) : undefined
//               }
//             />
//           </ToolPanel>

//           <ToolPanel
//             heading="Decode Result"
//             para={
//               decodedResult
//                 ? "Review the detected barcode format and decoded content."
//                 : "Decoded barcode information will appear here after a scan."
//             }
//             headerSlot={
//               decodedResult ? (
//                 <ToolFeaturePill label={decodedResult.barcodeType} />
//               ) : undefined
//             }
//           >
//             {isScanning ? (
//               <ToolLoadingState
//                 title="Scanning barcode..."
//                 description="Processing the uploaded image and extracting barcode data."
//               />
//             ) : decodedResult ? (
//               <div className="space-y-5">
//                 <ToolInfoCard
//                   eyebrow="Barcode type"
//                   title={decodedResult.barcodeType}
//                   titleClassName="text-lg font-semibold"
//                   className="bg-[hsl(var(--secondary)/0.26)]"
//                 />

//                 <ToolInfoCard
//                   eyebrow="Decoded content"
//                   title={decodedResult.value}
//                   titleClassName="break-all font-mono text-sm"
//                   className="bg-[hsl(var(--secondary)/0.26)]"
//                 />

//                 <ToolPillGroup>
//                   <Button onClick={() => copyValue(decodedResult.value)}>
//                     <Copy className="h-4 w-4" />
//                     Copy Result
//                   </Button>
//                 </ToolPillGroup>
//               </div>
//             ) : (
//               <ToolEmptyState
//                 icon={FileCode}
//                 title="No decoded barcode yet"
//                 description="Upload a barcode image and the extracted format and content will appear here."
//               />
//             )}
//           </ToolPanel>
//         </div>

//         <div className="grid gap-6 xl:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)]">
//           <ToolPanel
//             heading="Decoded History"
//             para={
//               decodedHistory.length
//                 ? "Review recently decoded barcode values and copy them again when needed."
//                 : "Decoded barcode values will be stored here after each successful scan."
//             }
//             headerSlot={
//               decodedHistory.length ? (
//                 <ToolFeaturePill icon={History} label={`${decodedHistory.length} saved`} />
//               ) : undefined
//             }
//           >
//             {decodedHistory.length ? (
//               <div className="space-y-3">
//                 {decodedHistory.map((record) => (
//                   <article
//                     key={record.id}
//                     className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.24)] p-4"
//                   >
//                     <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
//                       <div className="min-w-0 flex-1 space-y-2">
//                         <p className="break-all font-mono text-sm font-medium text-[hsl(var(--foreground))]">
//                           {truncateDashboardValue(record.value, 120)}
//                         </p>
//                         <ToolPillGroup>
//                           <ToolFeaturePill label={record.barcodeType} />
//                           <ToolFeaturePill label={formatDashboardDate(record.createdAt)} />
//                         </ToolPillGroup>
//                       </div>

//                       <Button
//                         variant="outline"
//                         size="sm"
//                         onClick={() => copyValue(record.value)}
//                       >
//                         <Copy className="h-4 w-4" />
//                         Copy
//                       </Button>
//                     </div>
//                   </article>
//                 ))}
//               </div>
//             ) : (
//               <ToolEmptyState
//                 icon={History}
//                 title="No decoded history yet"
//                 description="Decode a barcode and the recent results list will appear here."
//               />
//             )}
//           </ToolPanel>

//           <ToolPanel
//             heading="Decoder Analytics"
//             para="Track how many barcode values you decoded, how many unique formats appeared, and which format shows up most often."
//             headerSlot={<ToolFeaturePill icon={BarChart3} label="Decoder metrics" />}
//           >
//             {decodedHistory.length ? (
//               <div className="space-y-5">
//                 <div className="grid gap-3 sm:grid-cols-3">
//                   <ToolMetricCard
//                     label="Total Decoded"
//                     value={analytics.totalDecoded}
//                     valueClassName="text-2xl"
//                   />
//                   <ToolMetricCard
//                     label="Unique Formats"
//                     value={analytics.uniqueFormats}
//                     valueClassName="text-2xl"
//                   />
//                   <ToolMetricCard
//                     label="Top Format"
//                     value={analytics.topFormat}
//                     valueClassName="text-xl"
//                   />
//                 </div>

//                 <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.22)] p-4">
//                   <p className="text-sm font-semibold">Format Mix</p>
//                   <div className="mt-4 space-y-3">
//                     {Object.entries(analytics.byType).map(([type, count]) => (
//                       <div key={type} className="flex items-center justify-between gap-3">
//                         <span className="text-sm text-[hsl(var(--foreground))]">{type}</span>
//                         <span className="text-sm font-semibold text-[hsl(var(--muted-foreground))]">
//                           {count}
//                         </span>
//                       </div>
//                     ))}
//                   </div>
//                 </div>

//                 {analytics.latestRecord ? (
//                   <ToolInfoCard
//                     eyebrow="Latest decoded value"
//                     title={truncateDashboardValue(analytics.latestRecord.value, 120)}
//                     description={`Captured ${formatDashboardDate(analytics.latestRecord.createdAt)}`}
//                     titleClassName="break-all font-mono text-sm"
//                   />
//                 ) : null}
//               </div>
//             ) : (
//               <ToolEmptyState
//                 icon={BarChart3}
//                 title="No decoder analytics yet"
//                 description="Decode a few barcodes and the analytics snapshot will appear here."
//               />
//             )}
//           </ToolPanel>
//         </div>
//       </div>
//     </ToolPageShell>
//   );
// };

// export default BarcodeDecoder;
