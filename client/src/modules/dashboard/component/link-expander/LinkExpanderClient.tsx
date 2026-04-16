// "use client";

// import { Button } from "@/components/ui/Button";
// import { Input } from "@/components/ui/Input";
// import { Label } from "@/components/ui/Label";
// import { useToastNotification } from "@/utils/toast";
// import {
//   AlertTriangle,
//   BarChart3,
//   ExternalLink,
//   History,
//   Loader2,
//   Route,
//   ShieldCheck,
//   Sparkles,
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

// type ExpandedLink = {
//   shortUrl: string;
//   finalUrl: string;
//   redirectChain: string[];
//   isSafe: boolean;
//   metadata: {
//     title: string;
//     description: string;
//     domain: string;
//   };
// };

// type ExpandedLinkRecord = ExpandedLink & {
//   id: string;
//   createdAt: string;
//   opens: number;
// };

// const normalizeUrl = (value: string) =>
//   value.startsWith("http://") || value.startsWith("https://")
//     ? value
//     : `https://${value}`;

// const buildExpandedResult = (value: string): ExpandedLink => {
//   const shortUrl = normalizeUrl(value.trim());
//   const sourceUrl = new URL(shortUrl);
//   const shortCode = sourceUrl.pathname.replace(/\//g, "") || "demo";
//   const isSafe = !/(claim|bonus|verify|free|secure-update)/i.test(shortUrl);
//   const domain = isSafe ? "www.example.com" : "suspicious-redirect.net";
//   const finalUrl = isSafe
//     ? `https://${domain}/destination/${shortCode}?ref=expanded`
//     : `https://${domain}/offer/${shortCode}?campaign=urgent`;

//   return {
//     shortUrl,
//     finalUrl,
//     redirectChain: [
//       shortUrl,
//       `https://trk.linklab.app/r/${shortCode || "demo"}`,
//       finalUrl,
//     ],
//     isSafe,
//     metadata: {
//       title: isSafe
//         ? "Example destination preview"
//         : "Manual review recommended before opening",
//       description: isSafe
//         ? "This link resolves to a standard landing page with tracking parameters attached."
//         : "This redirect path contains aggressive phrasing and should be verified before sharing or opening.",
//       domain,
//     },
//   };
// };

// const LinkExpander = () => {
//   const notify = useToastNotification();
//   const [url, setUrl] = useState("");
//   const [isExpanding, setIsExpanding] = useState(false);
//   const [result, setResult] = useState<ExpandedLink | null>(null);
//   const [history, setHistory] = useState<ExpandedLinkRecord[]>(() =>
//     readStoredCollection<ExpandedLinkRecord>(DASHBOARD_STORAGE_KEYS.linkExpander),
//   );
//   const [activeRecordId, setActiveRecordId] = useState<string | null>(null);

//   useEffect(() => {
//     writeStoredCollection(DASHBOARD_STORAGE_KEYS.linkExpander, history);
//   }, [history]);

//   const analytics = useMemo(() => {
//     const safeLinks = history.filter((record) => record.isSafe).length;
//     const cautionLinks = history.length - safeLinks;
//     const totalHops = history.reduce((sum, record) => sum + record.redirectChain.length, 0);

//     return {
//       totalInspected: history.length,
//       safeLinks,
//       cautionLinks,
//       averageHops: history.length ? (totalHops / history.length).toFixed(1) : "0.0",
//       latestRecord: history[0] ?? null,
//       totalOpens: history.reduce((sum, record) => sum + record.opens, 0),
//     };
//   }, [history]);

//   const expandLink = async () => {
//     if (!url.trim()) {
//       notify("Enter a short URL to expand.", "warning");
//       return;
//     }

//     try {
//       setIsExpanding(true);
//       setResult(null);
//       await new Promise((resolve) => setTimeout(resolve, 800));
//       const nextResult = buildExpandedResult(url);
//       const nextRecord: ExpandedLinkRecord = {
//         id: crypto.randomUUID(),
//         ...nextResult,
//         opens: 0,
//         createdAt: new Date().toISOString(),
//       };

//       setResult(nextResult);
//       setHistory((previousRecords) => [nextRecord, ...previousRecords].slice(0, 24));
//       setActiveRecordId(nextRecord.id);
//       notify("Destination revealed.", "success");
//     } catch {
//       notify("Enter a valid URL to expand.", "error");
//     } finally {
//       setIsExpanding(false);
//     }
//   };

//   const openFinalUrl = (record: { id?: string; finalUrl: string }) => {
//     window.open(record.finalUrl, "_blank", "noopener,noreferrer");

//     if (record.id) {
//       setHistory((previousRecords) =>
//         previousRecords.map((entry) =>
//           entry.id === record.id ? { ...entry, opens: entry.opens + 1 } : entry,
//         ),
//       );
//     }
//   };

//   return (
//     <ToolPageShell
//       icon={ExternalLink}
//       heading="Link Expander"
//       para="Reveal the original destination of shortened URLs before clicking."
//       iconClassName="h-6 w-6 text-primary"
//     >
//       <div className="space-y-6">
//         <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
//           <ToolPanel
//             heading="Expand Short URL"
//             para="Paste a shortened link to trace its redirect chain, inspect the destination, and review a quick safety signal."
//             headerSlot={<ToolFeaturePill icon={Sparkles} label="Preview redirects" />}
//           >
//             <ToolPillGroup className="mb-5">
//               <ToolFeaturePill icon={Route} label="Redirect chain" />
//               <ToolFeaturePill icon={ShieldCheck} label="Quick destination signal" />
//               <ToolFeaturePill icon={ExternalLink} label="Open final URL" />
//             </ToolPillGroup>

//             <div className="space-y-4">
//               <div className="grid gap-2">
//                 <Label htmlFor="short-url">Shortened URL</Label>
//                 <Input
//                   id="short-url"
//                   placeholder="https://bit.ly/xyz123"
//                   value={url}
//                   onChange={(event) => setUrl(event.target.value)}
//                 />
//               </div>

//               <Button
//                 onClick={expandLink}
//                 disabled={isExpanding}
//                 className="w-full sm:w-auto"
//               >
//                 {isExpanding ? (
//                   <>
//                     <Loader2 className="h-4 w-4 animate-spin" />
//                     Expanding...
//                   </>
//                 ) : (
//                   <>
//                     <Route className="h-4 w-4" />
//                     Expand Link
//                   </>
//                 )}
//               </Button>
//             </div>
//           </ToolPanel>

//           <ToolPanel
//             heading="Expansion Result"
//             para={
//               result
//                 ? "Review the destination details and redirect path below."
//                 : "Expanded link details will appear here after you inspect a URL."
//             }
//             headerSlot={
//               result ? (
//                 <ToolFeaturePill
//                   icon={result.isSafe ? ShieldCheck : AlertTriangle}
//                   label={result.isSafe ? "Safe" : "Caution"}
//                   className={
//                     result.isSafe
//                       ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
//                       : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
//                   }
//                 />
//               ) : undefined
//             }
//           >
//             {result ? (
//               <div className="space-y-5">
//                 <ToolInfoCard eyebrow="Final destination" className="bg-[hsl(var(--secondary)/0.26)]">
//                   <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
//                     <p className="break-all font-mono text-sm text-[hsl(var(--primary))]">
//                       {result.finalUrl}
//                     </p>
//                     <Button
//                       variant="outline"
//                       size="sm"
//                       onClick={() =>
//                         openFinalUrl({
//                           id: activeRecordId ?? undefined,
//                           finalUrl: result.finalUrl,
//                         })
//                       }
//                     >
//                       <ExternalLink className="h-4 w-4" />
//                       Open
//                     </Button>
//                   </div>
//                 </ToolInfoCard>

//                 <div className="grid gap-4 sm:grid-cols-2">
//                   <ToolInfoCard eyebrow="Domain" title={result.metadata.domain} />
//                   <ToolInfoCard eyebrow="Detected title" title={result.metadata.title} />
//                 </div>

//                 <ToolInfoCard
//                   eyebrow="Description"
//                   description={result.metadata.description}
//                   className="bg-transparent"
//                 />

//                 <ToolInfoCard className="bg-transparent">
//                   <div className="flex items-center justify-between gap-3">
//                     <p className="text-sm font-semibold">Redirect chain</p>
//                     <ToolFeaturePill
//                       icon={Route}
//                       label={`${result.redirectChain.length} hops`}
//                     />
//                   </div>

//                   <div className="mt-4 space-y-3">
//                     {result.redirectChain.map((link, index) => (
//                       <div
//                         key={`${link}-${index}`}
//                         className="flex items-start gap-3"
//                       >
//                         <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[hsl(var(--secondary))] text-xs font-semibold">
//                           {index + 1}
//                         </span>
//                         <p className="break-all font-mono text-xs text-[hsl(var(--muted-foreground)/0.88)]">
//                           {link}
//                         </p>
//                       </div>
//                     ))}
//                   </div>
//                 </ToolInfoCard>
//               </div>
//             ) : (
//               <ToolEmptyState
//                 icon={Route}
//                 title="No expanded link yet"
//                 description="Paste a short URL and run the expander to inspect the redirect path and destination details."
//               />
//             )}
//           </ToolPanel>
//         </div>

//         <div className="grid gap-6 xl:grid-cols-[minmax(0,1.02fr)_minmax(0,0.98fr)]">
//           <ToolPanel
//             heading="Expansion History"
//             para={
//               history.length
//                 ? "Review recently inspected redirects, safety signals, and open counts."
//                 : "Inspected short links will be stored here after each expansion."
//             }
//             headerSlot={
//               history.length ? (
//                 <ToolFeaturePill icon={History} label={`${history.length} saved`} />
//               ) : undefined
//             }
//           >
//             {history.length ? (
//               <div className="space-y-3">
//                 {history.map((record) => (
//                   <article
//                     key={record.id}
//                     className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.24)] p-4"
//                   >
//                     <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
//                       <div className="min-w-0 flex-1 space-y-2">
//                         <p className="break-all font-mono text-sm font-medium text-[hsl(var(--foreground))]">
//                           {truncateDashboardValue(record.shortUrl, 96)}
//                         </p>
//                         <p className="break-all text-sm text-[hsl(var(--primary))]">
//                           {truncateDashboardValue(record.finalUrl, 110)}
//                         </p>
//                         <ToolPillGroup>
//                           <ToolFeaturePill
//                             icon={record.isSafe ? ShieldCheck : AlertTriangle}
//                             label={record.isSafe ? "Safe" : "Caution"}
//                           />
//                           <ToolFeaturePill label={`${record.redirectChain.length} hops`} />
//                           <ToolFeaturePill label={`${record.opens} opens`} />
//                           <ToolFeaturePill label={formatDashboardDate(record.createdAt)} />
//                         </ToolPillGroup>
//                       </div>

//                       <Button
//                         variant="outline"
//                         size="sm"
//                         onClick={() => openFinalUrl(record)}
//                       >
//                         <ExternalLink className="h-4 w-4" />
//                         Open
//                       </Button>
//                     </div>
//                   </article>
//                 ))}
//               </div>
//             ) : (
//               <ToolEmptyState
//                 icon={History}
//                 title="No expansion history yet"
//                 description="Expand a short link and the saved inspection history will appear here."
//               />
//             )}
//           </ToolPanel>

//           <ToolPanel
//             heading="Expander Analytics"
//             para="Track how many links you inspected, how many look safe, and how often final destinations were opened from this tool."
//             headerSlot={<ToolFeaturePill icon={BarChart3} label="Expander metrics" />}
//           >
//             {history.length ? (
//               <div className="space-y-5">
//                 <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
//                   <ToolMetricCard
//                     label="Inspected"
//                     value={analytics.totalInspected}
//                     valueClassName="text-2xl"
//                   />
//                   <ToolMetricCard
//                     label="Safe"
//                     value={analytics.safeLinks}
//                     valueClassName="text-2xl"
//                   />
//                   <ToolMetricCard
//                     label="Caution"
//                     value={analytics.cautionLinks}
//                     valueClassName="text-2xl"
//                   />
//                   <ToolMetricCard
//                     label="Opens"
//                     value={analytics.totalOpens}
//                     valueClassName="text-2xl"
//                   />
//                 </div>

//                 <ToolInfoCard
//                   eyebrow="Average redirect depth"
//                   title={`${analytics.averageHops} hops`}
//                   description="Average number of redirects observed per inspected short link."
//                 />

//                 {analytics.latestRecord ? (
//                   <ToolInfoCard
//                     eyebrow="Latest inspected link"
//                     title={truncateDashboardValue(analytics.latestRecord.finalUrl, 120)}
//                     description={`Expanded ${formatDashboardDate(analytics.latestRecord.createdAt)}`}
//                     titleClassName="break-all font-mono text-sm"
//                   />
//                 ) : null}
//               </div>
//             ) : (
//               <ToolEmptyState
//                 icon={BarChart3}
//                 title="No expander analytics yet"
//                 description="Inspect a few short links and the analytics snapshot will appear here."
//               />
//             )}
//           </ToolPanel>
//         </div>
//       </div>
//     </ToolPageShell>
//   );
// };

// export default LinkExpander;
