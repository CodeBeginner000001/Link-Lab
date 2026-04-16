// "use client";

// import { Button } from "@/components/ui/Button";
// import { useToastNotification } from "@/utils/toast";
// import {
//   BarChart3,
//   Camera,
//   Copy,
//   ExternalLink,
//   History,
//   ScanLine,
//   Upload,
// } from "lucide-react";
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

// type ScanResult = {
//   value: string;
//   type: string;
//   canOpen: boolean;
// };

// type ScanRecord = ScanResult & {
//   id: string;
//   createdAt: string;
// };

// const MOCK_RESULTS: ScanResult[] = [
//   {
//     value: "https://example.com/product/12345",
//     type: "URL",
//     canOpen: true,
//   },
//   {
//     value: "mailto:contact@example.com",
//     type: "Email",
//     canOpen: false,
//   },
//   {
//     value: "WIFI:S:HomeNetwork;T:WPA;P:password123;;",
//     type: "WiFi",
//     canOpen: false,
//   },
//   {
//     value: "https://github.com/user/repo",
//     type: "URL",
//     canOpen: true,
//   },
// ];

// const QRScanner = () => {
//   const notify = useToastNotification();
//   const fileInputRef = useRef<HTMLInputElement>(null);
//   const [isScanning, setIsScanning] = useState(false);
//   const [previewImage, setPreviewImage] = useState<string | null>(null);
//   const [scannedResult, setScannedResult] = useState<ScanResult | null>(null);
//   const [scanHistory, setScanHistory] = useState<ScanRecord[]>(() =>
//     readStoredCollection<ScanRecord>(DASHBOARD_STORAGE_KEYS.qrScanner),
//   );

//   useEffect(() => {
//     writeStoredCollection(DASHBOARD_STORAGE_KEYS.qrScanner, scanHistory);
//   }, [scanHistory]);

//   const analytics = useMemo(() => {
//     const byType = scanHistory.reduce<Record<string, number>>((accumulator, record) => {
//       accumulator[record.type] = (accumulator[record.type] ?? 0) + 1;
//       return accumulator;
//     }, {});

//     const topTypeEntry = Object.entries(byType).sort((firstEntry, secondEntry) => {
//       return secondEntry[1] - firstEntry[1];
//     })[0];

//     return {
//       totalScans: scanHistory.length,
//       openableScans: scanHistory.filter((record) => record.canOpen).length,
//       topType: topTypeEntry?.[0] ?? "N/A",
//       byType,
//       latestScan: scanHistory[0] ?? null,
//     };
//   }, [scanHistory]);

//   const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
//     const file = event.target.files?.[0];
//     if (!file) {
//       return;
//     }

//     const reader = new FileReader();
//     reader.onload = async (loadEvent) => {
//       setPreviewImage(loadEvent.target?.result as string);
//       setScannedResult(null);
//       setIsScanning(true);

//       await new Promise((resolve) => setTimeout(resolve, 1100));
//       const nextResult =
//         MOCK_RESULTS[Math.floor(Math.random() * MOCK_RESULTS.length)];
//       const nextRecord: ScanRecord = {
//         id: crypto.randomUUID(),
//         ...nextResult,
//         createdAt: new Date().toISOString(),
//       };

//       setScannedResult(nextResult);
//       setScanHistory((previousRecords) => [nextRecord, ...previousRecords].slice(0, 24));
//       setIsScanning(false);
//       notify("QR code decoded.", "success");
//     };

//     reader.onerror = () => {
//       notify("Unable to read the selected image.", "error");
//     };

//     reader.readAsDataURL(file);
//   };

//   const copyValue = async (value: string) => {
//     try {
//       await navigator.clipboard.writeText(value);
//       notify("Scan result copied.", "success");
//     } catch {
//       notify("Unable to copy the scan result.", "error");
//     }
//   };

//   const openValue = (value: string) => {
//     window.open(value, "_blank", "noopener,noreferrer");
//   };

//   return (
//     <ToolPageShell
//       icon={ScanLine}
//       heading="QR Code Scanner"
//       para="Instantly scan and decode QR codes from images."
//       iconClassName="h-6 w-6 text-primary"
//     >
//       <div className="space-y-6">
//         <div className="grid gap-6 xl:grid-cols-[minmax(0,0.96fr)_minmax(0,1.04fr)]">
//           <ToolPanel
//             heading="Upload QR Code"
//             para="Choose an image containing a QR code. The scanner preview and decoded content will update after processing."
//             headerSlot={<ToolFeaturePill icon={Upload} label="Image upload" />}
//           >
//             <ToolPillGroup className="mb-5">
//               <ToolFeaturePill icon={ScanLine} label="Image scanning" />
//               <ToolFeaturePill icon={Camera} label="Camera placeholder" />
//               <ToolFeaturePill icon={Copy} label="Copy decoded value" />
//             </ToolPillGroup>

//             <input
//               ref={fileInputRef}
//               type="file"
//               accept="image/*"
//               onChange={handleFileUpload}
//               className="hidden"
//             />

//             <div className="space-y-4">
//               <ToolUploadZone
//                 icon={Upload}
//                 title="Drop image here or click to upload"
//                 description="Upload JPG, PNG, or GIF files containing a QR code."
//                 hint="Preview supported"
//                 onClick={() => fileInputRef.current?.click()}
//                 preview={
//                   previewImage ? (
//                     <div className="relative h-[220px] w-full overflow-hidden rounded-2xl">
//                       <Image
//                         src={previewImage}
//                         alt="QR code preview"
//                         fill
//                         unoptimized
//                         className="object-contain"
//                       />
//                     </div>
//                   ) : undefined
//                 }
//               />

//               <Button variant="outline" className="w-full" disabled>
//                 <Camera className="h-4 w-4" />
//                 Use Camera
//               </Button>
//             </div>
//           </ToolPanel>

//           <ToolPanel
//             heading="Scan Result"
//             para={
//               scannedResult
//                 ? "Review the decoded content and take action below."
//                 : "Decoded QR content will appear here once an image has been scanned."
//             }
//             headerSlot={
//               scannedResult ? (
//                 <ToolFeaturePill label={scannedResult.type} />
//               ) : undefined
//             }
//           >
//             {isScanning ? (
//               <ToolLoadingState
//                 title="Scanning QR code..."
//                 description="Processing the uploaded image and extracting the payload."
//               />
//             ) : scannedResult ? (
//               <div className="space-y-5">
//                 <ToolInfoCard
//                   eyebrow="Decoded content"
//                   title={scannedResult.value}
//                   titleClassName="break-all font-mono text-sm text-[hsl(var(--foreground))]"
//                   className="bg-[hsl(var(--secondary)/0.26)]"
//                 />

//                 <ToolPillGroup>
//                   <ToolFeaturePill icon={ScanLine} label={scannedResult.type} />
//                   <ToolFeaturePill
//                     icon={Upload}
//                     label={previewImage ? "Preview loaded" : "No preview"}
//                   />
//                 </ToolPillGroup>

//                 <ToolPillGroup>
//                   <Button
//                     variant="outline"
//                     onClick={() => copyValue(scannedResult.value)}
//                   >
//                     <Copy className="h-4 w-4" />
//                     Copy
//                   </Button>
//                   {scannedResult.canOpen ? (
//                     <Button onClick={() => openValue(scannedResult.value)}>
//                       <ExternalLink className="h-4 w-4" />
//                       Open Link
//                     </Button>
//                   ) : null}
//                 </ToolPillGroup>
//               </div>
//             ) : (
//               <ToolEmptyState
//                 icon={ScanLine}
//                 title="No scan result yet"
//                 description="Upload a QR code image and the decoded text or link will appear here."
//               />
//             )}
//           </ToolPanel>
//         </div>

//         <div className="grid gap-6 xl:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)]">
//           <ToolPanel
//             heading="Recent Scans"
//             para={
//               scanHistory.length
//                 ? "Review your latest decoded QR payloads and reopen or copy them when needed."
//                 : "Decoded QR payloads will be stored here after each successful scan."
//             }
//             headerSlot={
//               scanHistory.length ? (
//                 <ToolFeaturePill icon={History} label={`${scanHistory.length} saved`} />
//               ) : undefined
//             }
//           >
//             {scanHistory.length ? (
//               <div className="space-y-3">
//                 {scanHistory.map((record) => (
//                   <article
//                     key={record.id}
//                     className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.24)] p-4"
//                   >
//                     <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
//                       <div className="min-w-0 flex-1 space-y-2">
//                         <p className="break-all font-mono text-sm font-medium text-[hsl(var(--foreground))]">
//                           {truncateDashboardValue(record.value, 110)}
//                         </p>
//                         <ToolPillGroup>
//                           <ToolFeaturePill label={record.type} />
//                           <ToolFeaturePill label={formatDashboardDate(record.createdAt)} />
//                           <ToolFeaturePill label={record.canOpen ? "Openable" : "Read-only"} />
//                         </ToolPillGroup>
//                       </div>

//                       <ToolPillGroup>
//                         <Button
//                           variant="outline"
//                           size="sm"
//                           onClick={() => copyValue(record.value)}
//                         >
//                           <Copy className="h-4 w-4" />
//                           Copy
//                         </Button>
//                         {record.canOpen ? (
//                           <Button
//                             variant="outline"
//                             size="sm"
//                             onClick={() => openValue(record.value)}
//                           >
//                             <ExternalLink className="h-4 w-4" />
//                             Open
//                           </Button>
//                         ) : null}
//                       </ToolPillGroup>
//                     </div>
//                   </article>
//                 ))}
//               </div>
//             ) : (
//               <ToolEmptyState
//                 icon={History}
//                 title="No saved scans yet"
//                 description="Scan a QR image and the decoded payload history will appear here."
//               />
//             )}
//           </ToolPanel>

//           <ToolPanel
//             heading="Scan Analytics"
//             para="Track how many QR payloads you decoded, how many are openable links, and which payload type appears most often."
//             headerSlot={<ToolFeaturePill icon={BarChart3} label="Scanner metrics" />}
//           >
//             {scanHistory.length ? (
//               <div className="space-y-5">
//                 <div className="grid gap-3 sm:grid-cols-3">
//                   <ToolMetricCard
//                     label="Total Scans"
//                     value={analytics.totalScans}
//                     valueClassName="text-2xl"
//                   />
//                   <ToolMetricCard
//                     label="Openable Links"
//                     value={analytics.openableScans}
//                     valueClassName="text-2xl"
//                   />
//                   <ToolMetricCard
//                     label="Top Payload"
//                     value={analytics.topType}
//                     valueClassName="text-xl"
//                   />
//                 </div>

//                 <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.22)] p-4">
//                   <p className="text-sm font-semibold">Payload Mix</p>
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

//                 {analytics.latestScan ? (
//                   <ToolInfoCard
//                     eyebrow="Latest scan"
//                     title={truncateDashboardValue(analytics.latestScan.value, 120)}
//                     description={`Captured ${formatDashboardDate(analytics.latestScan.createdAt)}`}
//                     titleClassName="break-all font-mono text-sm"
//                   />
//                 ) : null}
//               </div>
//             ) : (
//               <ToolEmptyState
//                 icon={BarChart3}
//                 title="No scan analytics yet"
//                 description="Complete a few QR scans and the analytics snapshot will appear here."
//               />
//             )}
//           </ToolPanel>
//         </div>
//       </div>
//     </ToolPageShell>
//   );
// };

// export default QRScanner;
