// "use client";

// import { Button } from "@/components/ui/Button";
// import { Input } from "@/components/ui/Input";
// import { Label } from "@/components/ui/Label";
// import { useToastNotification } from "@/utils/toast";
// import {
//   BarChart3,
//   Edit3,
//   ExternalLink,
//   History,
//   Loader2,
//   QrCode,
//   Save,
// } from "lucide-react";
// import { useEffect, useMemo, useState } from "react";
// import ToolEmptyState from "../common/ToolEmptyState";
// import ToolFeaturePill from "../common/ToolFeaturePill";
// import ToolInfoCard from "../common/ToolInfoCard";
// import ToolMetricCard from "../common/ToolMetricCard";
// import ToolPageShell from "../common/ToolPageShell";
// import ToolPanel from "../common/ToolPanel";
// import ToolPillGroup from "../common/ToolPillGroup";
// import {
//   DASHBOARD_STORAGE_KEYS,
//   formatDashboardDate,
//   readStoredCollection,
//   truncateDashboardValue,
//   writeStoredCollection,
// } from "../../lib/toolStorage";

// type DynamicQR = {
//   id: string;
//   name: string;
//   currentUrl: string;
//   scans: number;
//   createdAt: string;
//   history: { url: string; changedAt: string }[];
// };

// const normalizeUrl = (value: string) =>
//   value.startsWith("http://") || value.startsWith("https://")
//     ? value
//     : `https://${value}`;

// const DynamicQRGenerator = () => {
//   const notify = useToastNotification();
//   const [name, setName] = useState("");
//   const [url, setUrl] = useState("");
//   const [isCreating, setIsCreating] = useState(false);
//   const [dynamicQRs, setDynamicQRs] = useState<DynamicQR[]>(() =>
//     readStoredCollection<DynamicQR>(DASHBOARD_STORAGE_KEYS.dynamicQr),
//   );
//   const [editingId, setEditingId] = useState<string | null>(null);
//   const [editUrl, setEditUrl] = useState("");

//   useEffect(() => {
//     writeStoredCollection(DASHBOARD_STORAGE_KEYS.dynamicQr, dynamicQRs);
//   }, [dynamicQRs]);

//   const analytics = useMemo(() => {
//     const totalScans = dynamicQRs.reduce((sum, qr) => sum + qr.scans, 0);
//     const totalUpdates = dynamicQRs.reduce(
//       (sum, qr) => sum + Math.max(0, qr.history.length - 1),
//       0,
//     );

//     const topScanned = [...dynamicQRs].sort((firstQr, secondQr) => {
//       return secondQr.scans - firstQr.scans;
//     })[0] ?? null;

//     const latestUpdated = [...dynamicQRs].sort((firstQr, secondQr) => {
//       const firstChangedAt = firstQr.history[0]?.changedAt ?? firstQr.createdAt;
//       const secondChangedAt = secondQr.history[0]?.changedAt ?? secondQr.createdAt;
//       return new Date(secondChangedAt).getTime() - new Date(firstChangedAt).getTime();
//     })[0] ?? null;

//     return {
//       totalQRCodes: dynamicQRs.length,
//       totalScans,
//       totalUpdates,
//       topScanned,
//       latestUpdated,
//     };
//   }, [dynamicQRs]);

//   const createDynamicQR = async () => {
//     if (!name.trim() || !url.trim()) {
//       notify("Enter a QR name and destination URL.", "warning");
//       return;
//     }

//     setIsCreating(true);
//     await new Promise((resolve) => setTimeout(resolve, 850));

//     const createdAt = new Date().toISOString();
//     const normalizedUrl = normalizeUrl(url.trim());
//     const nextQR: DynamicQR = {
//       id: crypto.randomUUID(),
//       name: name.trim(),
//       currentUrl: normalizedUrl,
//       scans: Math.floor(Math.random() * 120),
//       createdAt,
//       history: [{ url: normalizedUrl, changedAt: createdAt }],
//     };

//     setDynamicQRs((previous) => [nextQR, ...previous].slice(0, 24));
//     setName("");
//     setUrl("");
//     setIsCreating(false);
//     notify("Dynamic QR created.", "success");
//   };

//   const beginEdit = (qr: DynamicQR) => {
//     setEditingId(qr.id);
//     setEditUrl(qr.currentUrl);
//   };

//   const updateQRUrl = (id: string) => {
//     if (!editUrl.trim()) {
//       notify("Enter a destination URL to save.", "warning");
//       return;
//     }

//     const changedAt = new Date().toISOString();
//     const normalizedUrl = normalizeUrl(editUrl.trim());
//     setDynamicQRs((previous) =>
//       previous.map((qr) =>
//         qr.id === id
//           ? {
//               ...qr,
//               currentUrl: normalizedUrl,
//               history: [
//                 { url: normalizedUrl, changedAt },
//                 ...qr.history,
//               ],
//             }
//           : qr,
//       ),
//     );

//     setEditingId(null);
//     setEditUrl("");
//     notify("QR destination updated.", "success");
//   };

//   return (
//     <ToolPageShell
//       icon={Edit3}
//       heading="Dynamic QR Editor"
//       para="Edit QR code destinations without reprinting codes."
//       iconClassName="h-6 w-6 text-primary"
//     >
//       <div className="space-y-6">
//         <div className="grid gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
//           <ToolPanel
//             heading="Create Dynamic QR"
//             para="Create QR codes whose destination can be changed later while keeping the same printed code."
//             headerSlot={<ToolFeaturePill icon={QrCode} label="Editable destination" />}
//           >
//             <ToolPillGroup className="mb-5">
//               <ToolFeaturePill icon={Edit3} label="Destination updates" />
//               <ToolFeaturePill icon={History} label="Version history" />
//               <ToolFeaturePill icon={QrCode} label="Campaign-ready" />
//             </ToolPillGroup>

//             <div className="space-y-4">
//               <div className="grid gap-2">
//                 <Label htmlFor="dynamic-qr-name">QR Name</Label>
//                 <Input
//                   id="dynamic-qr-name"
//                   placeholder="Spring campaign QR"
//                   value={name}
//                   onChange={(event) => setName(event.target.value)}
//                 />
//               </div>

//               <div className="grid gap-2">
//                 <Label htmlFor="dynamic-qr-url">Destination URL</Label>
//                 <Input
//                   id="dynamic-qr-url"
//                   placeholder="https://example.com"
//                   value={url}
//                   onChange={(event) => setUrl(event.target.value)}
//                 />
//               </div>

//               <Button
//                 onClick={createDynamicQR}
//                 disabled={isCreating}
//                 className="w-full sm:w-auto"
//               >
//                 {isCreating ? (
//                   <>
//                     <Loader2 className="h-4 w-4 animate-spin" />
//                     Creating...
//                   </>
//                 ) : (
//                   <>
//                     <QrCode className="h-4 w-4" />
//                     Create Dynamic QR
//                   </>
//                 )}
//               </Button>
//             </div>
//           </ToolPanel>

//           <ToolPanel
//             heading="Dynamic QR Library"
//             para={
//               dynamicQRs.length
//                 ? "Manage live destinations, review scan counts, and inspect change history."
//                 : "Created dynamic QR entries will appear here."
//             }
//             headerSlot={
//               dynamicQRs.length ? (
//                 <ToolFeaturePill icon={History} label={`${dynamicQRs.length} entries`} />
//               ) : undefined
//             }
//           >
//             {dynamicQRs.length ? (
//               <div className="space-y-4">
//                 {dynamicQRs.map((qr) => (
//                   <article
//                     key={qr.id}
//                     className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.24)] p-4"
//                   >
//                     <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
//                       <div className="min-w-0 flex-1 space-y-2">
//                         <div className="flex flex-wrap items-center gap-2">
//                           <p className="text-base font-semibold">{qr.name}</p>
//                           <ToolFeaturePill label={`${qr.scans} scans`} />
//                           <ToolFeaturePill label={`${Math.max(0, qr.history.length - 1)} updates`} />
//                           <ToolFeaturePill label={`Created ${formatDashboardDate(qr.createdAt)}`} />
//                         </div>

//                         {editingId === qr.id ? (
//                           <div className="flex flex-col gap-2 sm:flex-row">
//                             <Input
//                               value={editUrl}
//                               onChange={(event) => setEditUrl(event.target.value)}
//                               placeholder="https://example.com/new-destination"
//                             />
//                             <Button onClick={() => updateQRUrl(qr.id)}>
//                               <Save className="h-4 w-4" />
//                               Save
//                             </Button>
//                           </div>
//                         ) : (
//                           <p className="break-all text-sm text-[hsl(var(--primary))]">
//                             {qr.currentUrl}
//                           </p>
//                         )}
//                       </div>

//                       <div className="flex flex-wrap gap-2">
//                         <Button variant="outline" size="sm" onClick={() => beginEdit(qr)}>
//                           <Edit3 className="h-4 w-4" />
//                           Edit
//                         </Button>
//                         <Button variant="outline" size="sm" asChild>
//                           <a
//                             href={qr.currentUrl}
//                             target="_blank"
//                             rel="noopener noreferrer"
//                           >
//                             <ExternalLink className="h-4 w-4" />
//                             Open
//                           </a>
//                         </Button>
//                       </div>
//                     </div>

//                     {qr.history.length > 1 ? (
//                       <details className="mt-4 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-4">
//                         <summary className="cursor-pointer text-sm font-medium">
//                           Version history ({qr.history.length})
//                         </summary>
//                         <div className="mt-3 space-y-2">
//                           {qr.history.map((entry, index) => (
//                             <div key={`${entry.url}-${index}`} className="text-xs">
//                               <p className="break-all font-mono text-[hsl(var(--muted-foreground)/0.84)]">
//                                 {entry.url}
//                               </p>
//                               <p className="mt-1 text-[hsl(var(--muted-foreground)/0.7)]">
//                                 {formatDashboardDate(entry.changedAt)}
//                               </p>
//                             </div>
//                           ))}
//                         </div>
//                       </details>
//                     ) : null}
//                   </article>
//                 ))}
//               </div>
//             ) : (
//               <ToolEmptyState
//                 icon={QrCode}
//                 title="No dynamic QR codes yet"
//                 description="Create a dynamic QR and it will appear here with editable destinations and history tracking."
//               />
//             )}
//           </ToolPanel>
//         </div>

//         <ToolPanel
//           heading="Dynamic QR Analytics"
//           para="Track how many live QR destinations you manage, total scan volume, and how frequently destinations are updated."
//           headerSlot={<ToolFeaturePill icon={BarChart3} label="Dynamic QR metrics" />}
//         >
//           {dynamicQRs.length ? (
//             <div className="space-y-5">
//               <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
//                 <ToolMetricCard
//                   label="Managed QRs"
//                   value={analytics.totalQRCodes}
//                   valueClassName="text-2xl"
//                 />
//                 <ToolMetricCard
//                   label="Total Scans"
//                   value={analytics.totalScans}
//                   valueClassName="text-2xl"
//                 />
//                 <ToolMetricCard
//                   label="Destination Updates"
//                   value={analytics.totalUpdates}
//                   valueClassName="text-2xl"
//                 />
//                 <ToolMetricCard
//                   label="Top QR"
//                   value={analytics.topScanned?.name ?? "N/A"}
//                   valueClassName="text-xl"
//                 />
//               </div>

//               <div className="grid gap-4 xl:grid-cols-2">
//                 {analytics.topScanned ? (
//                   <ToolInfoCard
//                     eyebrow="Most scanned QR"
//                     title={analytics.topScanned.name}
//                     description={`${analytics.topScanned.scans} scans routed to ${truncateDashboardValue(analytics.topScanned.currentUrl, 84)}`}
//                   />
//                 ) : null}

//                 {analytics.latestUpdated ? (
//                   <ToolInfoCard
//                     eyebrow="Latest updated destination"
//                     title={analytics.latestUpdated.name}
//                     description={`Last change ${formatDashboardDate(analytics.latestUpdated.history[0]?.changedAt ?? analytics.latestUpdated.createdAt)}`}
//                   />
//                 ) : null}
//               </div>
//             </div>
//           ) : (
//             <ToolEmptyState
//               icon={BarChart3}
//               title="No dynamic QR analytics yet"
//               description="Create a few editable QR entries and the analytics snapshot will appear here."
//             />
//           )}
//         </ToolPanel>
//       </div>
//     </ToolPageShell>
//   );
// };

// export default DynamicQRGenerator;
