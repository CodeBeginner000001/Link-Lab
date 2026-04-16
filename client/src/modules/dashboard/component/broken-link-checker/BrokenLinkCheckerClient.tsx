// "use client";

// import MotionWrapper from "@/components/common/MotionWrapper";
// import { Button } from "@/components/ui/Button";
// import { useToastNotification } from "@/utils/toast";
// import {
//   AlertCircle,
//   CheckCircle2,
//   Clock3,
//   Download,
//   Loader2,
//   RefreshCw,
//   XCircle,
// } from "lucide-react";
// import { useState } from "react";
// import Heading from "../common/Heading";
// import ToolEmptyState from "../common/ToolEmptyState";
// import ToolFeaturePill from "../common/ToolFeaturePill";
// import ToolMetricCard from "../common/ToolMetricCard";
// import ToolPanel from "../common/ToolPanel";

// type LinkCheckResult = {
//   url: string;
//   status: "ok" | "broken" | "redirect" | "timeout";
//   statusCode?: number;
//   responseTime: number;
//   redirectUrl?: string;
// };

// const getStatusMeta = (status: LinkCheckResult["status"]) => {
//   switch (status) {
//     case "ok":
//       return {
//         icon: CheckCircle2,
//         label: "Working",
//         className:
//           "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
//       };
//     case "broken":
//       return {
//         icon: XCircle,
//         label: "Broken",
//         className:
//           "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300",
//       };
//     case "redirect":
//       return {
//         icon: RefreshCw,
//         label: "Redirect",
//         className:
//           "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
//       };
//     case "timeout":
//       return {
//         icon: Clock3,
//         label: "Timeout",
//         className:
//           "border-slate-500/25 bg-slate-500/10 text-slate-700 dark:text-slate-300",
//       };
//   }
// };

// const csvEscape = (value: string | number | undefined) =>
//   `"${String(value ?? "N/A").replace(/"/g, '""')}"`;

// const BrokenLinkChecker = () => {
//   const notify = useToastNotification();
//   const [urls, setUrls] = useState("");
//   const [isChecking, setIsChecking] = useState(false);
//   const [progress, setProgress] = useState(0);
//   const [results, setResults] = useState<LinkCheckResult[]>([]);

//   const checkLinks = async () => {
//     const urlList = urls
//       .split("\n")
//       .map((value) => value.trim())
//       .filter(Boolean);

//     if (!urlList.length) {
//       notify("Enter at least one URL to check.", "warning");
//       return;
//     }

//     setIsChecking(true);
//     setProgress(0);
//     setResults([]);

//     const nextResults: LinkCheckResult[] = [];

//     for (let index = 0; index < urlList.length; index += 1) {
//       await new Promise((resolve) => setTimeout(resolve, 180));
//       const url = urlList[index];
//       const statuses: LinkCheckResult["status"][] = [
//         "ok",
//         "ok",
//         "redirect",
//         "broken",
//         "timeout",
//       ];
//       const status = statuses[index % statuses.length];

//       nextResults.push({
//         url,
//         status,
//         statusCode:
//           status === "ok"
//             ? 200
//             : status === "redirect"
//               ? 301
//               : status === "broken"
//                 ? 404
//                 : undefined,
//         responseTime: Math.floor(Math.random() * 450) + 60,
//         redirectUrl:
//           status === "redirect"
//             ? `https://redirected.example/${index + 1}`
//             : undefined,
//       });

//       setResults([...nextResults]);
//       setProgress(Math.round(((index + 1) / urlList.length) * 100));
//     }

//     setIsChecking(false);
//     notify(`Checked ${urlList.length} URL${urlList.length > 1 ? "s" : ""}.`, "success");
//   };

//   const exportReport = () => {
//     if (!results.length) {
//       notify("Run a check before exporting.", "warning");
//       return;
//     }

//     const csv = [
//       "URL,Status,Status Code,Response Time (ms),Redirect URL",
//       ...results.map((result) =>
//         [
//           csvEscape(result.url),
//           csvEscape(result.status),
//           csvEscape(result.statusCode),
//           csvEscape(result.responseTime),
//           csvEscape(result.redirectUrl),
//         ].join(","),
//       ),
//     ].join("\n");

//     const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
//     const objectUrl = URL.createObjectURL(blob);
//     const link = document.createElement("a");
//     link.href = objectUrl;
//     link.download = "broken-link-report.csv";
//     link.click();
//     setTimeout(() => URL.revokeObjectURL(objectUrl), 0);
//     notify("CSV report exported.", "success");
//   };

//   const stats = {
//     total: results.length,
//     ok: results.filter((result) => result.status === "ok").length,
//     broken: results.filter((result) => result.status === "broken").length,
//     redirects: results.filter((result) => result.status === "redirect").length,
//   };

//   return (
//     <MotionWrapper>
//       <div className="space-y-6">
//         <Heading
//           icon={AlertCircle}
//           heading="Broken Link Checker"
//           para="Detect and report broken links across a list of URLs."
//           iconClassName="h-6 w-6 text-primary"
//         />

//         <div className="grid gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
//           <ToolPanel
//             heading="Check URLs"
//             para="Paste one URL per line to simulate a batch status check and generate a quick link health report."
//             headerSlot={<ToolFeaturePill icon={AlertCircle} label="Batch input" />}
//           >
//             <div className="mb-5 flex flex-wrap gap-2">
//               <ToolFeaturePill icon={CheckCircle2} label="Working links" />
//               <ToolFeaturePill icon={XCircle} label="Broken targets" />
//               <ToolFeaturePill icon={Download} label="CSV export" />
//             </div>

//             <div className="space-y-4">
//               <div className="grid gap-2">
//                 <label
//                   htmlFor="urls"
//                   className="text-sm font-medium leading-none"
//                 >
//                   URLs
//                 </label>
//                 <textarea
//                   id="urls"
//                   value={urls}
//                   onChange={(event) => setUrls(event.target.value)}
//                   rows={9}
//                   placeholder={
//                     "https://example.com/page-1\nhttps://example.com/page-2\nhttps://example.com/page-3"
//                   }
//                   className="min-h-[220px] w-full rounded-xl border border-[hsl(var(--input))] bg-[hsl(var(--background))] px-3 py-3 text-sm ring-offset-[hsl(var(--background))] placeholder:text-[hsl(var(--muted-foreground)/0.9)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))]"
//                 />
//               </div>

//               {isChecking ? (
//                 <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.24)] p-4">
//                   <div className="flex items-center justify-between gap-3">
//                     <p className="text-sm font-medium">Checking links...</p>
//                     <span className="text-sm text-[hsl(var(--muted-foreground))]">
//                       {progress}%
//                     </span>
//                   </div>
//                   <div className="mt-3 h-2 overflow-hidden rounded-full bg-[hsl(var(--secondary))]">
//                     <div
//                       className="h-full rounded-full bg-[hsl(var(--primary))] transition-[width] duration-300"
//                       style={{ width: `${progress}%` }}
//                     />
//                   </div>
//                 </div>
//               ) : null}

//               <div className="flex flex-wrap gap-2">
//                 <Button onClick={checkLinks} disabled={isChecking}>
//                   {isChecking ? (
//                     <>
//                       <Loader2 className="h-4 w-4 animate-spin" />
//                       Checking...
//                     </>
//                   ) : (
//                     <>
//                       <AlertCircle className="h-4 w-4" />
//                       Check Links
//                     </>
//                   )}
//                 </Button>

//                 <Button
//                   variant="outline"
//                   onClick={exportReport}
//                   disabled={!results.length}
//                 >
//                   <Download className="h-4 w-4" />
//                   Export Report
//                 </Button>
//               </div>
//             </div>
//           </ToolPanel>

//           <ToolPanel
//             heading="Health Summary"
//             para={
//               results.length
//                 ? "Review the overall status distribution from the latest run."
//                 : "Link health totals will appear here after you run a check."
//             }
//             headerSlot={
//               results.length ? (
//                 <ToolFeaturePill
//                   icon={CheckCircle2}
//                   label={`${results.length} checked`}
//                 />
//               ) : undefined
//             }
//           >
//             {results.length ? (
//               <div className="grid gap-4 sm:grid-cols-2">
//                 <ToolMetricCard
//                   label="Total"
//                   value={stats.total}
//                   className="rounded-2xl bg-transparent"
//                   valueClassName="mt-3 text-3xl font-bold"
//                 />
//                 <ToolMetricCard
//                   label="Working"
//                   value={stats.ok}
//                   className="rounded-2xl border-emerald-500/25 bg-emerald-500/8"
//                   labelClassName="text-emerald-700 dark:text-emerald-300"
//                   valueClassName="mt-3 text-3xl font-bold text-emerald-700 dark:text-emerald-300"
//                 />
//                 <ToolMetricCard
//                   label="Broken"
//                   value={stats.broken}
//                   className="rounded-2xl border-rose-500/25 bg-rose-500/8"
//                   labelClassName="text-rose-700 dark:text-rose-300"
//                   valueClassName="mt-3 text-3xl font-bold text-rose-700 dark:text-rose-300"
//                 />
//                 <ToolMetricCard
//                   label="Redirects"
//                   value={stats.redirects}
//                   className="rounded-2xl border-amber-500/25 bg-amber-500/8"
//                   labelClassName="text-amber-700 dark:text-amber-300"
//                   valueClassName="mt-3 text-3xl font-bold text-amber-700 dark:text-amber-300"
//                 />
//               </div>
//             ) : (
//               <ToolEmptyState
//                 icon={AlertCircle}
//                 title="No report yet"
//                 description="Run a broken-link check and the summary totals will appear here."
//               />
//             )}
//           </ToolPanel>
//         </div>

//         <ToolPanel
//           heading="Detailed Results"
//           para={
//             results.length
//               ? "Each checked URL is listed with status, response timing, and redirect details when available."
//               : "Detailed per-link results will appear here after a scan."
//           }
//         >
//           {results.length ? (
//             <div className="space-y-3">
//               {results.map((result) => {
//                 const statusMeta = getStatusMeta(result.status);
//                 const StatusIcon = statusMeta.icon;

//                 return (
//                   <article
//                     key={`${result.url}-${result.status}-${result.responseTime}`}
//                     className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.24)] p-4"
//                   >
//                     <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
//                       <div className="min-w-0 flex-1 space-y-2">
//                         <p className="break-all font-mono text-sm font-medium">
//                           {result.url}
//                         </p>
//                         <div className="flex flex-wrap gap-2">
//                           <ToolFeaturePill
//                             icon={StatusIcon}
//                             label={statusMeta.label}
//                             className={statusMeta.className}
//                           />
//                           <ToolFeaturePill
//                             icon={Clock3}
//                             label={`${result.responseTime} ms`}
//                           />
//                           {result.statusCode ? (
//                             <ToolFeaturePill label={`HTTP ${result.statusCode}`} />
//                           ) : null}
//                         </div>
//                         {result.redirectUrl ? (
//                           <p className="text-xs text-[hsl(var(--muted-foreground)/0.82)]">
//                             Redirects to{" "}
//                             <span className="font-mono">{result.redirectUrl}</span>
//                           </p>
//                         ) : null}
//                       </div>
//                     </div>
//                   </article>
//                 );
//               })}
//             </div>
//           ) : (
//             <ToolEmptyState
//               icon={Download}
//               title="No detailed results yet"
//               description="Paste URLs into the checker to generate a per-link report."
//             />
//           )}
//         </ToolPanel>
//       </div>
//     </MotionWrapper>
//   );
// };

// export default BrokenLinkChecker;
