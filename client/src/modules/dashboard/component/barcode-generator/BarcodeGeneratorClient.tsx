// "use client";

// import { Button } from "@/components/ui/Button";
// import { Input } from "@/components/ui/Input";
// import { Label } from "@/components/ui/Label";
// import { useToastNotification } from "@/utils/toast";
// import {
//   BarChart3,
//   Barcode,
//   Copy,
//   Download,
//   History,
//   Loader2,
//   Palette,
//   ScanBarcode,
// } from "lucide-react";
// import { useEffect, useMemo, useRef, useState } from "react";
// import ToolEmptyState from "../common/ToolEmptyState";
// import ToolFeaturePill from "../common/ToolFeaturePill";
// import ToolInfoCard from "../common/ToolInfoCard";
// import ToolMetricCard from "../common/ToolMetricCard";
// import ToolPageShell from "../common/ToolPageShell";
// import ToolPanel from "../common/ToolPanel";
// import ToolPillGroup from "../common/ToolPillGroup";
// import ToolPreviewFrame from "../common/ToolPreviewFrame";
// import ToolSegmentedTabs from "../common/ToolSegmentedTabs";
// import {
//   DASHBOARD_STORAGE_KEYS,
//   formatDashboardDate,
//   readStoredCollection,
//   truncateDashboardValue,
//   writeStoredCollection,
// } from "../../lib/toolStorage";

// const BARCODE_TYPES = [
//   { value: "CODE128", label: "Code 128", hint: "Any text" },
//   { value: "EAN13", label: "EAN-13", hint: "12 or 13 digits" },
//   { value: "EAN8", label: "EAN-8", hint: "7 or 8 digits" },
//   { value: "UPC", label: "UPC-A", hint: "11 or 12 digits" },
//   { value: "CODE39", label: "Code 39", hint: "Alphanumeric" },
// ] as const;

// type BarcodeType = (typeof BARCODE_TYPES)[number]["value"];

// type GeneratedBarcodeRecord = {
//   id: string;
//   type: BarcodeType;
//   content: string;
//   createdAt: string;
//   exports: {
//     png: number;
//     svg: number;
//   };
// };

// const drawPseudoBarcode = (
//   canvas: HTMLCanvasElement,
//   content: string,
//   type: BarcodeType,
// ) => {
//   const context = canvas.getContext("2d");
//   if (!context) {
//     return;
//   }

//   canvas.width = 460;
//   canvas.height = 150;

//   context.fillStyle = "#ffffff";
//   context.fillRect(0, 0, canvas.width, canvas.height);

//   context.fillStyle = "#111111";
//   let x = 24;
//   const top = 20;
//   const barHeight = 84;

//   for (let index = 0; index < content.length; index += 1) {
//     const charCode = content.charCodeAt(index);
//     for (let bit = 0; bit < 8; bit += 1) {
//       const isWide = ((charCode >> bit) & 1) === 1;
//       const width = isWide ? 4 : 2;

//       if ((index + bit + type.length) % 2 === 0) {
//         context.fillRect(x, top, width, barHeight);
//       }

//       x += width + 1;

//       if (x > canvas.width - 28) {
//         break;
//       }
//     }

//     x += 2;
//     if (x > canvas.width - 28) {
//       break;
//     }
//   }

//   context.font = "13px monospace";
//   context.textAlign = "center";
//   context.fillText(content, canvas.width / 2, 126);
// };

// const getRecordExportCount = (record: GeneratedBarcodeRecord) =>
//   record.exports.png + record.exports.svg;

// const BarcodeGenerator = () => {
//   const notify = useToastNotification();
//   const canvasRef = useRef<HTMLCanvasElement>(null);
//   const [content, setContent] = useState("");
//   const [barcodeType, setBarcodeType] = useState<BarcodeType>("CODE128");
//   const [isGenerating, setIsGenerating] = useState(false);
//   const [generated, setGenerated] = useState(false);
//   const [generatedRecords, setGeneratedRecords] = useState<GeneratedBarcodeRecord[]>(() =>
//     readStoredCollection<GeneratedBarcodeRecord>(DASHBOARD_STORAGE_KEYS.barcodeGenerator),
//   );
//   const [activeRecordId, setActiveRecordId] = useState<string | null>(null);

//   useEffect(() => {
//     writeStoredCollection(DASHBOARD_STORAGE_KEYS.barcodeGenerator, generatedRecords);
//   }, [generatedRecords]);

//   const selectedType = BARCODE_TYPES.find((item) => item.value === barcodeType)!;
//   const activeRecord = useMemo(
//     () => generatedRecords.find((record) => record.id === activeRecordId) ?? null,
//     [generatedRecords, activeRecordId],
//   );

//   const analytics = useMemo(() => {
//     const byType = BARCODE_TYPES.map((typeOption) => ({
//       label: typeOption.label,
//       value: typeOption.value,
//       count: generatedRecords.filter((record) => record.type === typeOption.value).length,
//     }));

//     const topTypeEntry = [...byType].sort((firstEntry, secondEntry) => {
//       return secondEntry.count - firstEntry.count;
//     })[0];

//     return {
//       totalGenerated: generatedRecords.length,
//       totalExports: generatedRecords.reduce(
//         (sum, record) => sum + getRecordExportCount(record),
//         0,
//       ),
//       topType: topTypeEntry && topTypeEntry.count > 0 ? topTypeEntry.label : "N/A",
//       byType,
//       latestRecord: generatedRecords[0] ?? null,
//     };
//   }, [generatedRecords]);

//   const renderPreview = (nextContent: string, nextType: BarcodeType) => {
//     const canvas = canvasRef.current;
//     if (!canvas) {
//       notify("Barcode preview is not ready yet.", "error");
//       return false;
//     }

//     drawPseudoBarcode(canvas, nextContent, nextType);
//     return true;
//   };

//   const updateRecord = (
//     id: string,
//     updater: (record: GeneratedBarcodeRecord) => GeneratedBarcodeRecord,
//   ) => {
//     setGeneratedRecords((previousRecords) =>
//       previousRecords.map((record) => (record.id === id ? updater(record) : record)),
//     );
//   };

//   const generateBarcode = async () => {
//     const trimmedContent = content.trim();
//     if (!trimmedContent) {
//       notify("Enter content for the barcode.", "warning");
//       return;
//     }

//     setIsGenerating(true);
//     await new Promise((resolve) => setTimeout(resolve, 450));

//     const didRender = renderPreview(trimmedContent, barcodeType);
//     if (!didRender) {
//       setIsGenerating(false);
//       return;
//     }

//     const nextRecord: GeneratedBarcodeRecord = {
//       id: crypto.randomUUID(),
//       type: barcodeType,
//       content: trimmedContent,
//       createdAt: new Date().toISOString(),
//       exports: {
//         png: 0,
//         svg: 0,
//       },
//     };

//     setGenerated(true);
//     setGeneratedRecords((previousRecords) => [nextRecord, ...previousRecords].slice(0, 24));
//     setActiveRecordId(nextRecord.id);
//     setIsGenerating(false);
//     notify("Barcode generated.", "success");
//   };

//   const loadRecord = (record: GeneratedBarcodeRecord) => {
//     setContent(record.content);
//     setBarcodeType(record.type);
//     const didRender = renderPreview(record.content, record.type);
//     if (!didRender) {
//       return;
//     }

//     setGenerated(true);
//     setActiveRecordId(record.id);
//     notify("Saved barcode loaded.", "success");
//   };

//   const copyContent = async (value: string) => {
//     try {
//       await navigator.clipboard.writeText(value);
//       notify("Barcode content copied.", "success");
//     } catch {
//       notify("Unable to copy the barcode content.", "error");
//     }
//   };

//   const downloadBarcode = (format: "png" | "svg") => {
//     const canvas = canvasRef.current;
//     if (!canvas || !generated) {
//       notify("Generate a barcode before exporting.", "warning");
//       return;
//     }

//     const link = document.createElement("a");

//     if (format === "png") {
//       link.download = `barcode-${barcodeType.toLowerCase()}.png`;
//       link.href = canvas.toDataURL("image/png");
//       link.click();
//     } else {
//       const pngDataUrl = canvas.toDataURL("image/png");
//       const svgMarkup = `
//         <svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}" viewBox="0 0 ${canvas.width} ${canvas.height}">
//           <rect width="100%" height="100%" fill="#ffffff" />
//           <image href="${pngDataUrl}" width="${canvas.width}" height="${canvas.height}" />
//         </svg>
//       `.trim();
//       const blob = new Blob([svgMarkup], {
//         type: "image/svg+xml;charset=utf-8",
//       });
//       const objectUrl = URL.createObjectURL(blob);

//       link.download = `barcode-${barcodeType.toLowerCase()}.svg`;
//       link.href = objectUrl;
//       link.click();
//       setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
//     }

//     if (activeRecordId) {
//       updateRecord(activeRecordId, (record) => ({
//         ...record,
//         exports: {
//           ...record.exports,
//           [format]: record.exports[format] + 1,
//         },
//       }));
//     }

//     notify(`Barcode exported as ${format.toUpperCase()}.`, "success");
//   };

//   return (
//     <ToolPageShell
//       icon={Barcode}
//       heading="Barcode Generator"
//       para="Create various barcode formats including UPC, EAN, Code 128, and more."
//       iconClassName="h-6 w-6 text-primary"
//     >
//       <div className="space-y-6">
//         <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.92fr)]">
//           <ToolPanel
//             heading="Create Barcode"
//             para="Choose a format, enter the encoded content, and generate a clean barcode preview for export."
//             headerSlot={<ToolFeaturePill icon={Palette} label="Canvas preview" />}
//           >
//             <ToolPillGroup className="mb-5">
//               <ToolFeaturePill icon={Barcode} label="Multiple formats" />
//               <ToolFeaturePill icon={Download} label="PNG and SVG export" />
//               <ToolFeaturePill icon={Copy} label="Copy content" />
//             </ToolPillGroup>

//             <div className="space-y-5">
//               <div className="space-y-2">
//                 <Label>Barcode Type</Label>
//                 <ToolSegmentedTabs
//                   options={BARCODE_TYPES.map((item) => ({
//                     value: item.value,
//                     label: item.label,
//                   }))}
//                   value={barcodeType}
//                   onValueChange={(value) => {
//                     if (BARCODE_TYPES.some((item) => item.value === value)) {
//                       setBarcodeType(value as BarcodeType);
//                       setGenerated(false);
//                     }
//                   }}
//                 />
//                 <p className="text-xs text-[hsl(var(--muted-foreground)/0.84)]">
//                   {selectedType.hint}
//                 </p>
//               </div>

//               <div className="grid gap-2">
//                 <Label htmlFor="barcode-content">Content</Label>
//                 <Input
//                   id="barcode-content"
//                   placeholder="Enter barcode content"
//                   value={content}
//                   onChange={(event) => {
//                     setContent(event.target.value);
//                     setGenerated(false);
//                   }}
//                 />
//               </div>

//               <div className="flex flex-wrap gap-2">
//                 <Button onClick={generateBarcode} disabled={isGenerating}>
//                   {isGenerating ? (
//                     <>
//                       <Loader2 className="h-4 w-4 animate-spin" />
//                       Generating...
//                     </>
//                   ) : (
//                     <>
//                       <Barcode className="h-4 w-4" />
//                       Generate Barcode
//                     </>
//                   )}
//                 </Button>

//                 <Button
//                   variant="outline"
//                   onClick={() => copyContent(content)}
//                   disabled={!content.trim()}
//                 >
//                   <Copy className="h-4 w-4" />
//                   Copy Content
//                 </Button>
//               </div>
//             </div>
//           </ToolPanel>

//           <ToolPanel
//             heading="Preview"
//             para="Your generated barcode will appear here with export actions once it is ready."
//             headerSlot={
//               <ToolFeaturePill
//                 label={
//                   activeRecord
//                     ? `Active ${truncateDashboardValue(activeRecord.id, 8)}`
//                     : selectedType.label
//                 }
//               />
//             }
//           >
//             <div className="space-y-5">
//               <ToolPreviewFrame innerClassName="min-h-[220px] bg-white">
//                 <canvas
//                   ref={canvasRef}
//                   width={460}
//                   height={150}
//                   className={generated ? "h-auto w-full max-w-[460px]" : "hidden"}
//                 />

//                 {!generated ? (
//                   <ToolEmptyState
//                     icon={ScanBarcode}
//                     title="Barcode preview"
//                     description="Generate a barcode to see the rendered preview and export actions."
//                     className="min-h-0 w-full border-none bg-transparent p-0 shadow-none"
//                   />
//                 ) : null}
//               </ToolPreviewFrame>

//               <ToolPillGroup>
//                 <ToolFeaturePill label={`Type: ${selectedType.label}`} />
//                 <ToolFeaturePill label={selectedType.hint} />
//               </ToolPillGroup>

//               <ToolPillGroup>
//                 <Button
//                   variant="outline"
//                   onClick={() => downloadBarcode("png")}
//                   disabled={!generated}
//                 >
//                   <Download className="h-4 w-4" />
//                   PNG
//                 </Button>
//                 <Button
//                   variant="outline"
//                   onClick={() => downloadBarcode("svg")}
//                   disabled={!generated}
//                 >
//                   <Download className="h-4 w-4" />
//                   SVG
//                 </Button>
//               </ToolPillGroup>
//             </div>
//           </ToolPanel>
//         </div>

//         <div className="grid gap-6 xl:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)]">
//           <ToolPanel
//             heading="Generated Barcodes"
//             para={
//               generatedRecords.length
//                 ? "Reload previous barcode payloads, review export counts, and reuse past work."
//                 : "Generated barcodes will appear here after you create them."
//             }
//             headerSlot={
//               generatedRecords.length ? (
//                 <ToolFeaturePill icon={History} label={`${generatedRecords.length} saved`} />
//               ) : undefined
//             }
//           >
//             {generatedRecords.length ? (
//               <div className="space-y-3">
//                 {generatedRecords.map((record) => (
//                   <article
//                     key={record.id}
//                     className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.24)] p-4"
//                   >
//                     <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
//                       <div className="min-w-0 flex-1 space-y-2">
//                         <p className="break-all font-mono text-sm font-medium text-[hsl(var(--foreground))]">
//                           {truncateDashboardValue(record.content, 120)}
//                         </p>
//                         <ToolPillGroup>
//                           <ToolFeaturePill
//                             label={BARCODE_TYPES.find((item) => item.value === record.type)?.label ?? record.type}
//                           />
//                           <ToolFeaturePill label={formatDashboardDate(record.createdAt)} />
//                           <ToolFeaturePill label={`${getRecordExportCount(record)} exports`} />
//                         </ToolPillGroup>
//                       </div>

//                       <ToolPillGroup>
//                         <Button
//                           variant="outline"
//                           size="sm"
//                           onClick={() => copyContent(record.content)}
//                         >
//                           <Copy className="h-4 w-4" />
//                           Copy
//                         </Button>
//                         <Button
//                           variant="outline"
//                           size="sm"
//                           onClick={() => loadRecord(record)}
//                         >
//                           <History className="h-4 w-4" />
//                           Load
//                         </Button>
//                       </ToolPillGroup>
//                     </div>
//                   </article>
//                 ))}
//               </div>
//             ) : (
//               <ToolEmptyState
//                 icon={History}
//                 title="No barcode history yet"
//                 description="Generate a barcode and the saved library will appear here."
//               />
//             )}
//           </ToolPanel>

//           <ToolPanel
//             heading="Barcode Analytics"
//             para="Track how many barcode assets you created, how many exports you made, and which format you use most often."
//             headerSlot={<ToolFeaturePill icon={BarChart3} label="Generator metrics" />}
//           >
//             {generatedRecords.length ? (
//               <div className="space-y-5">
//                 <div className="grid gap-3 sm:grid-cols-3">
//                   <ToolMetricCard
//                     label="Generated"
//                     value={analytics.totalGenerated}
//                     valueClassName="text-2xl"
//                   />
//                   <ToolMetricCard
//                     label="Exports"
//                     value={analytics.totalExports}
//                     valueClassName="text-2xl"
//                   />
//                   <ToolMetricCard
//                     label="Top Format"
//                     value={analytics.topType}
//                     valueClassName="text-xl"
//                   />
//                 </div>

//                 <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.22)] p-4">
//                   <p className="text-sm font-semibold">Format Mix</p>
//                   <div className="mt-4 space-y-3">
//                     {analytics.byType.map((entry) => (
//                       <div key={entry.value} className="flex items-center justify-between gap-3">
//                         <span className="text-sm text-[hsl(var(--foreground))]">{entry.label}</span>
//                         <span className="text-sm font-semibold text-[hsl(var(--muted-foreground))]">
//                           {entry.count}
//                         </span>
//                       </div>
//                     ))}
//                   </div>
//                 </div>

//                 {analytics.latestRecord ? (
//                   <ToolInfoCard
//                     eyebrow="Latest generated barcode"
//                     title={truncateDashboardValue(analytics.latestRecord.content, 120)}
//                     description={`Created ${formatDashboardDate(analytics.latestRecord.createdAt)}`}
//                     titleClassName="break-all font-mono text-sm"
//                   />
//                 ) : null}
//               </div>
//             ) : (
//               <ToolEmptyState
//                 icon={BarChart3}
//                 title="No barcode analytics yet"
//                 description="Generate a few barcodes and the analytics snapshot will appear here."
//               />
//             )}
//           </ToolPanel>
//         </div>
//       </div>
//     </ToolPageShell>
//   );
// };

// export default BarcodeGenerator;
