// "use client";

// import { useAuth } from "@/Provider/AuthUserProvider";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
// import { Button } from "@/components/ui/Button";
// import {
//   ArrowRight,
//   Barcode,
//   BarChart3,
//   Clock,
//   Edit3,
//   ExternalLink,
//   Globe,
//   LayoutDashboard,
//   Link2,
//   LinkIcon,
//   Mail,
//   QrCode,
//   ScanBarcode,
//   ScanLine,
//   Settings,
//   Sparkles,
// } from "lucide-react";
// import Link from "next/link";
// import { useMemo, useSyncExternalStore } from "react";
// import ToolEmptyState from "../common/ToolEmptyState";
// import ToolFeaturePill from "../common/ToolFeaturePill";
// import ToolInfoCard from "../common/ToolInfoCard";
// import ToolMetricCard from "../common/ToolMetricCard";
// import ToolPageShell from "../common/ToolPageShell";
// import ToolPanel from "../common/ToolPanel";
// import ToolPillGroup from "../common/ToolPillGroup";
// import {
//   DASHBOARD_STORAGE_KEYS,
//   DEFAULT_DASHBOARD_PREFERENCES,
//   formatDashboardDate,
//   isDashboardPreferences,
//   readStoredCollection,
//   readStoredValue,
//   truncateDashboardValue,
// } from "../../lib/toolStorage";

// type DashboardActivity = {
//   id: string;
//   title: string;
//   detail: string;
//   createdAt: string;
//   href: string;
// };

// type ToolCard = {
//   name: string;
//   href: string;
//   description: string;
//   icon: typeof LayoutDashboard;
//   count: number | null;
//   note: string;
// };

// const BASE_TOOL_CARDS: Array<Omit<ToolCard, "count" | "note">> = [
//   {
//     name: "URL Shortener",
//     href: "/dashboard/url-shortener",
//     description: "Create short links with server-backed click analytics.",
//     icon: Link2,
//   },
//   {
//     name: "QR Code Generator",
//     href: "/dashboard/qr-generator",
//     description: "Design QR codes, save records, and review engagement metrics.",
//     icon: QrCode,
//   },
//   {
//     name: "QR Code Scanner",
//     href: "/dashboard/qr-scanner",
//     description: "Decode uploaded QR payloads and review saved scan history.",
//     icon: ScanLine,
//   },
//   {
//     name: "Dynamic QR Generator",
//     href: "/dashboard/dynamic-qr",
//     description: "Manage editable QR destinations, scans, and update history.",
//     icon: Edit3,
//   },
//   {
//     name: "Link Expander",
//     href: "/dashboard/link-expander",
//     description: "Inspect redirect chains, safety signals, and saved expansions.",
//     icon: ExternalLink,
//   },
//   {
//     name: "Broken Link Checker",
//     href: "/dashboard/broken-link-checker",
//     description: "Run per-batch health checks and export URL status reports.",
//     icon: LinkIcon,
//   },
//   {
//     name: "Barcode Generator",
//     href: "/dashboard/barcode-generator",
//     description: "Generate barcode assets, reload saved payloads, and track exports.",
//     icon: Barcode,
//   },
//   {
//     name: "Barcode Decoder",
//     href: "/dashboard/barcode-decoder",
//     description: "Decode uploaded barcodes and track recent format history.",
//     icon: ScanBarcode,
//   },
//   {
//     name: "One-Time Link",
//     href: "/dashboard/one-time-link",
//     description: "Manage active and expired single-use links with copy metrics.",
//     icon: Clock,
//   },
//   {
//     name: "DNS & Domain Checker",
//     href: "/dashboard/dns-checker",
//     description: "Inspect availability, DNS records, and WHOIS data per lookup.",
//     icon: Globe,
//   },
// ];

// const getGreeting = () => {
//   const hour = new Date().getHours();

//   if (hour < 12) {
//     return "Good morning";
//   }

//   if (hour < 18) {
//     return "Good afternoon";
//   }

//   return "Good evening";
// };

// const getInitials = (name?: string | null) => {
//   if (!name?.trim()) {
//     return "LL";
//   }

//   const parts = name.trim().split(/\s+/).slice(0, 2);
//   return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "LL";
// };

// export default function Dashboard() {
//   const user = useAuth();
//   const hasHydrated = useSyncExternalStore(
//     () => () => undefined,
//     () => true,
//     () => false,
//   );

//   const overview = useMemo(() => {
//     const emptyCards: ToolCard[] = BASE_TOOL_CARDS.map((card) => ({
//       ...card,
//       count: null,
//       note: "Open tool",
//     }));

//     if (!hasHydrated) {
//       return {
//         toolCards: emptyCards,
//         activities: [] as DashboardActivity[],
//         preferences: DEFAULT_DASHBOARD_PREFERENCES,
//         summary: {
//           savedRecords: 0,
//           trackedActions: 0,
//           analyticsReadyTools: emptyCards.filter((card) => card.count !== null).length,
//           availableTools: BASE_TOOL_CARDS.length,
//         },
//       };
//     }

//     const qrGeneratorRecords = readStoredCollection<{
//       id: string;
//       content: string;
//       createdAt: string;
//       clicks: number;
//       exports: { png: number; svg: number };
//     }>(DASHBOARD_STORAGE_KEYS.qrGenerator);

//     const qrScannerRecords = readStoredCollection<{
//       id: string;
//       value: string;
//       type: string;
//       createdAt: string;
//     }>(DASHBOARD_STORAGE_KEYS.qrScanner);

//     const barcodeDecoderRecords = readStoredCollection<{
//       id: string;
//       value: string;
//       barcodeType: string;
//       createdAt: string;
//     }>(DASHBOARD_STORAGE_KEYS.barcodeDecoder);

//     const barcodeGeneratorRecords = readStoredCollection<{
//       id: string;
//       content: string;
//       createdAt: string;
//       exports: { png: number; svg: number };
//     }>(DASHBOARD_STORAGE_KEYS.barcodeGenerator);

//     const linkExpanderRecords = readStoredCollection<{
//       id: string;
//       shortUrl: string;
//       finalUrl: string;
//       createdAt: string;
//       opens: number;
//       isSafe: boolean;
//     }>(DASHBOARD_STORAGE_KEYS.linkExpander);

//     const dynamicQrRecords = readStoredCollection<{
//       id: string;
//       name: string;
//       currentUrl: string;
//       createdAt: string;
//       scans: number;
//       history: Array<{ changedAt: string }>;
//     }>(DASHBOARD_STORAGE_KEYS.dynamicQr);

//     const oneTimeLinkRecords = readStoredCollection<{
//       id: string;
//       url: string;
//       destination: string;
//       createdAt: string;
//       isUsed: boolean;
//       copyCount: number;
//     }>(DASHBOARD_STORAGE_KEYS.oneTimeLink);

//     const preferences = readStoredValue(
//       DASHBOARD_STORAGE_KEYS.settings,
//       DEFAULT_DASHBOARD_PREFERENCES,
//       isDashboardPreferences,
//     );

//     const toolCards: ToolCard[] = BASE_TOOL_CARDS.map((card) => {
//       switch (card.name) {
//         case "QR Code Generator":
//           return {
//             ...card,
//             count: qrGeneratorRecords.length,
//             note: `${qrGeneratorRecords.reduce((sum, record) => sum + record.clicks + record.exports.png + record.exports.svg, 0)} tracked actions`,
//           };
//         case "QR Code Scanner":
//           return {
//             ...card,
//             count: qrScannerRecords.length,
//             note: qrScannerRecords.length ? `${qrScannerRecords[0].type} scanned most recently` : "No saved scans yet",
//           };
//         case "Dynamic QR Generator":
//           return {
//             ...card,
//             count: dynamicQrRecords.length,
//             note: `${dynamicQrRecords.reduce((sum, record) => sum + record.scans, 0)} scans tracked`,
//           };
//         case "Link Expander":
//           return {
//             ...card,
//             count: linkExpanderRecords.length,
//             note: `${linkExpanderRecords.reduce((sum, record) => sum + record.opens, 0)} destination opens`,
//           };
//         case "Barcode Generator":
//           return {
//             ...card,
//             count: barcodeGeneratorRecords.length,
//             note: `${barcodeGeneratorRecords.reduce((sum, record) => sum + record.exports.png + record.exports.svg, 0)} exports tracked`,
//           };
//         case "Barcode Decoder":
//           return {
//             ...card,
//             count: barcodeDecoderRecords.length,
//             note: `${new Set(barcodeDecoderRecords.map((record) => record.barcodeType)).size} formats seen`,
//           };
//         case "One-Time Link":
//           return {
//             ...card,
//             count: oneTimeLinkRecords.length,
//             note: `${oneTimeLinkRecords.filter((record) => !record.isUsed).length} active`,
//           };
//         case "URL Shortener":
//           return { ...card, count: null, note: "Server-backed analytics" };
//         case "Broken Link Checker":
//           return { ...card, count: null, note: "Per-run analytics in tool" };
//         case "DNS & Domain Checker":
//           return { ...card, count: null, note: "Lookup analytics in tool" };
//         default:
//           return { ...card, count: null, note: "Open tool" };
//       }
//     });

//     const activities: DashboardActivity[] = [
//       ...qrGeneratorRecords.map((record) => ({
//         id: `qr-generator-${record.id}`,
//         title: "QR Code Generator",
//         detail: truncateDashboardValue(record.content, 96),
//         createdAt: record.createdAt,
//         href: "/dashboard/qr-generator",
//       })),
//       ...qrScannerRecords.map((record) => ({
//         id: `qr-scanner-${record.id}`,
//         title: "QR Code Scanner",
//         detail: truncateDashboardValue(record.value, 96),
//         createdAt: record.createdAt,
//         href: "/dashboard/qr-scanner",
//       })),
//       ...barcodeDecoderRecords.map((record) => ({
//         id: `barcode-decoder-${record.id}`,
//         title: "Barcode Decoder",
//         detail: `${record.barcodeType} · ${truncateDashboardValue(record.value, 84)}`,
//         createdAt: record.createdAt,
//         href: "/dashboard/barcode-decoder",
//       })),
//       ...barcodeGeneratorRecords.map((record) => ({
//         id: `barcode-generator-${record.id}`,
//         title: "Barcode Generator",
//         detail: truncateDashboardValue(record.content, 96),
//         createdAt: record.createdAt,
//         href: "/dashboard/barcode-generator",
//       })),
//       ...linkExpanderRecords.map((record) => ({
//         id: `link-expander-${record.id}`,
//         title: "Link Expander",
//         detail: truncateDashboardValue(record.finalUrl, 96),
//         createdAt: record.createdAt,
//         href: "/dashboard/link-expander",
//       })),
//       ...dynamicQrRecords.map((record) => ({
//         id: `dynamic-qr-${record.id}`,
//         title: "Dynamic QR Generator",
//         detail: `${record.name} · ${truncateDashboardValue(record.currentUrl, 82)}`,
//         createdAt: record.history[0]?.changedAt ?? record.createdAt,
//         href: "/dashboard/dynamic-qr",
//       })),
//       ...oneTimeLinkRecords.map((record) => ({
//         id: `one-time-link-${record.id}`,
//         title: "One-Time Link",
//         detail: truncateDashboardValue(record.url, 96),
//         createdAt: record.createdAt,
//         href: "/dashboard/one-time-link",
//       })),
//     ]
//       .sort((firstActivity, secondActivity) => {
//         return new Date(secondActivity.createdAt).getTime() - new Date(firstActivity.createdAt).getTime();
//       })
//       .slice(0, preferences.recentActivityLimit);

//     const savedRecords =
//       qrGeneratorRecords.length +
//       qrScannerRecords.length +
//       barcodeDecoderRecords.length +
//       barcodeGeneratorRecords.length +
//       linkExpanderRecords.length +
//       dynamicQrRecords.length +
//       oneTimeLinkRecords.length;

//     const trackedActions =
//       qrGeneratorRecords.reduce(
//         (sum, record) => sum + record.clicks + record.exports.png + record.exports.svg,
//         0,
//       ) +
//       qrScannerRecords.length +
//       barcodeDecoderRecords.length +
//       barcodeGeneratorRecords.reduce(
//         (sum, record) => sum + record.exports.png + record.exports.svg,
//         0,
//       ) +
//       linkExpanderRecords.reduce((sum, record) => sum + record.opens, 0) +
//       dynamicQrRecords.reduce(
//         (sum, record) => sum + record.scans + Math.max(0, record.history.length - 1),
//         0,
//       ) +
//       oneTimeLinkRecords.reduce((sum, record) => sum + record.copyCount, 0);

//     return {
//       toolCards,
//       activities,
//       preferences,
//       summary: {
//         savedRecords,
//         trackedActions,
//         analyticsReadyTools: toolCards.filter((card) => card.count !== null).length,
//         availableTools: BASE_TOOL_CARDS.length,
//       },
//     };
//   }, [hasHydrated]);

//   const readyCards = useMemo(
//     () => overview.toolCards.filter((card) => card.count !== null && card.count > 0),
//     [overview.toolCards],
//   );
//   const { toolCards, activities, preferences, summary } = overview;
//   const topUsedTool = useMemo(() => {
//     return [...readyCards].sort((firstCard, secondCard) => {
//       return (secondCard.count ?? 0) - (firstCard.count ?? 0);
//     })[0] ?? null;
//   }, [readyCards]);
//   const preferredTool = useMemo(() => {
//     return toolCards.find((card) => card.href === preferences.preferredToolHref) ?? null;
//   }, [preferences.preferredToolHref, toolCards]);
//   const launchTool = preferredTool ?? topUsedTool ?? toolCards[0] ?? null;
//   const greeting = getGreeting();
//   const firstName = user?.name?.trim().split(/\s+/)[0] ?? "there";

//   return (
//     <ToolPageShell
//       icon={LayoutDashboard}
//       heading={`${greeting}, ${firstName}`}
//       para="Review your account activity, jump into the tools you use most, and keep your LinkLab workspace moving."
//       iconClassName="h-6 w-6 text-primary"
//     >
//       <div className="space-y-6">
//         <div className="grid gap-6 xl:grid-cols-[minmax(0,1.18fr)_minmax(320px,0.82fr)]">
//           <ToolPanel
//             heading="User Dashboard"
//             para="A personalized workspace snapshot based on your saved tool activity and the features already active in this account."
//             headerSlot={<ToolFeaturePill icon={Sparkles} label="Personalized overview" />}
//           >
//             <div className="space-y-5">
//               <div className="space-y-3">
//                 <p className="text-2xl font-semibold tracking-tight text-[hsl(var(--foreground))] sm:text-3xl">
//                   {greeting}, {firstName}.
//                 </p>
//                 <p className="max-w-2xl text-sm text-[hsl(var(--muted-foreground)/0.88)] sm:text-base">
//                   {summary.savedRecords
//                     ? `You have ${summary.savedRecords} saved records and ${summary.trackedActions} tracked actions across your active dashboard tools.`
//                     : "Your workspace is ready. Start with a generator, scanner, or link tool and the dashboard will begin surfacing your activity here."}
//                 </p>
//               </div>

//               <ToolPillGroup>
//                 {user?.email ? (
//                   <ToolFeaturePill icon={Mail} label={user.email} />
//                 ) : null}
//                 <ToolFeaturePill label={`${summary.analyticsReadyTools} analytics-ready tools`} />
//                 <ToolFeaturePill label={`${summary.availableTools} tools available`} />
//                 {preferredTool ? (
//                   <ToolFeaturePill label={`Launch tool: ${preferredTool.name}`} />
//                 ) : null}
//                 {topUsedTool ? (
//                   <ToolFeaturePill label={`Most used: ${topUsedTool.name}`} />
//                 ) : null}
//               </ToolPillGroup>

//               <div className="grid gap-3 sm:grid-cols-3">
//                 <ToolMetricCard
//                   label="Saved Records"
//                   value={summary.savedRecords}
//                   valueClassName="text-2xl"
//                 />
//                 <ToolMetricCard
//                   label="Tracked Actions"
//                   value={summary.trackedActions}
//                   valueClassName="text-2xl"
//                 />
//                 <ToolMetricCard
//                   label="Active Tools"
//                   value={readyCards.length}
//                   valueClassName="text-2xl"
//                 />
//               </div>

//               <div className="flex flex-wrap gap-2.5">
//                 <Button asChild>
//                   <Link href={launchTool?.href ?? "/dashboard/url-shortener"}>
//                     {launchTool ? `Open ${launchTool.name}` : "Open URL Shortener"}
//                     <ArrowRight className="h-4 w-4" />
//                   </Link>
//                 </Button>

//                 <Button variant="outline" asChild>
//                   <Link href="/dashboard/settings">
//                     <Settings className="h-4 w-4" />
//                     Profile Settings
//                   </Link>
//                 </Button>
//               </div>
//             </div>
//           </ToolPanel>

//           <ToolPanel
//             heading="Account Snapshot"
//             para="Your profile identity plus a fast summary of what is happening across the workspace right now."
//             headerSlot={<ToolFeaturePill icon={LayoutDashboard} label="User profile" />}
//           >
//             <div className="space-y-5">
//               <div className="flex items-center gap-4">
//                 <Avatar className="h-16 w-16 border border-[hsl(var(--border))]">
//                   <AvatarImage
//                     src={user?.avatar || undefined}
//                     className="object-cover"
//                   />
//                   <AvatarFallback className="text-sm font-semibold">
//                     {getInitials(user?.name)}
//                   </AvatarFallback>
//                 </Avatar>

//                 <div className="min-w-0 space-y-1">
//                   <p className="truncate text-lg font-semibold text-[hsl(var(--foreground))]">
//                     {user?.name ?? "LinkLab User"}
//                   </p>
//                   <p className="truncate text-sm text-[hsl(var(--muted-foreground)/0.88)]">
//                     {user?.email ?? "Signed-in workspace"}
//                   </p>
//                 </div>
//               </div>

//               <ToolInfoCard
//                 eyebrow="Focus for today"
//                 title={
//                   topUsedTool
//                     ? `Keep momentum in ${topUsedTool.name}`
//                     : "Start with your first tool workflow"
//                 }
//                 description={
//                   topUsedTool
//                     ? `${topUsedTool.note}. Jump back in to continue the same flow.`
//                     : "Generate or scan something once, and this dashboard will start building a personal activity timeline."
//                 }
//               />

//               <div className="grid gap-3 sm:grid-cols-2">
//                 <ToolMetricCard
//                   label="Recent Activity"
//                   value={activities.length}
//                   valueClassName="text-2xl"
//                 />
//                 <ToolMetricCard
//                   label="Top Tool"
//                   value={topUsedTool?.name ?? "None yet"}
//                   valueClassName="text-lg"
//                 />
//               </div>
//             </div>
//           </ToolPanel>
//         </div>

//         <ToolPanel
//           heading="Workspace Snapshot"
//           para="A quick summary of saved records and analytics coverage across the dashboard tools that now persist local activity."
//           headerSlot={<ToolFeaturePill icon={BarChart3} label="Overview metrics" />}
//         >
//           <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
//             <ToolMetricCard
//               label="Available Tools"
//               value={summary.availableTools}
//               valueClassName="text-2xl"
//             />
//             <ToolMetricCard
//               label="Saved Records"
//               value={summary.savedRecords}
//               valueClassName="text-2xl"
//             />
//             <ToolMetricCard
//               label="Tracked Actions"
//               value={summary.trackedActions}
//               valueClassName="text-2xl"
//             />
//             <ToolMetricCard
//               label="Analytics-Ready"
//               value={summary.analyticsReadyTools}
//               valueClassName="text-2xl"
//             />
//           </div>
//         </ToolPanel>

//         <ToolPanel
//           heading="Tool Access"
//           para="Open any feature directly. Cards with saved counts are already feeding the dashboard overview from their local analytics history."
//           headerSlot={
//             readyCards.length ? (
//               <ToolPillGroup>
//                 <ToolFeaturePill label={`${readyCards.length} tools with saved history`} />
//                 <ToolFeaturePill label={`${summary.savedRecords} total stored records`} />
//               </ToolPillGroup>
//             ) : undefined
//           }
//         >
//           <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
//             {toolCards.map((card) => {
//               const Icon = card.icon;

//               return (
//                 <article
//                   key={card.name}
//                   className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4"
//                 >
//                   <div className="flex h-full flex-col gap-4">
//                     <div className="flex items-start justify-between gap-3">
//                       <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.3)] p-3">
//                         <Icon className="h-5 w-5 text-[hsl(var(--foreground))]" />
//                       </div>
//                       <ToolFeaturePill
//                         label={card.count === null ? card.note : `${card.count} records`}
//                       />
//                     </div>

//                     <div className="space-y-2">
//                       <p className="text-base font-semibold text-[hsl(var(--foreground))]">
//                         {card.name}
//                       </p>
//                       <p className="text-sm text-[hsl(var(--muted-foreground)/0.88)]">
//                         {card.description}
//                       </p>
//                     </div>

//                     <ToolInfoCard
//                       eyebrow="Current status"
//                       description={card.note}
//                       className="bg-[hsl(var(--secondary)/0.18)]"
//                     />

//                     <Button asChild className="mt-auto w-full">
//                       <Link href={card.href}>Open Tool</Link>
//                     </Button>
//                   </div>
//                 </article>
//               );
//             })}
//           </div>
//         </ToolPanel>

//         <ToolPanel
//           heading="Recent Activity"
//           para={`The latest saved actions across QR, barcode, link expansion, dynamic QR, and one-time link tools. Showing up to ${preferences.recentActivityLimit} items.`}
//           headerSlot={
//             <ToolPillGroup>
//               <ToolFeaturePill icon={LayoutDashboard} label="Cross-tool timeline" />
//               <ToolFeaturePill label={`Limit ${preferences.recentActivityLimit}`} />
//             </ToolPillGroup>
//           }
//         >
//           {activities.length ? (
//             <div className="space-y-3">
//               {activities.map((activity) => (
//                 <article
//                   key={activity.id}
//                   className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.22)] p-4"
//                 >
//                   <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
//                     <div className="min-w-0 flex-1 space-y-2">
//                       <ToolPillGroup>
//                         <ToolFeaturePill label={activity.title} />
//                         <ToolFeaturePill label={formatDashboardDate(activity.createdAt)} />
//                       </ToolPillGroup>
//                       <p className="break-all font-mono text-sm text-[hsl(var(--foreground))]">
//                         {activity.detail}
//                       </p>
//                     </div>

//                     <Button variant="outline" asChild>
//                       <Link href={activity.href}>View Tool</Link>
//                     </Button>
//                   </div>
//                 </article>
//               ))}
//             </div>
//           ) : (
//             <ToolEmptyState
//               icon={LayoutDashboard}
//               title="No saved activity yet"
//               description="Use one of the dashboard tools with local analytics enabled and your cross-tool timeline will appear here."
//             />
//           )}
//         </ToolPanel>
//       </div>
//     </ToolPageShell>
//   );
// }
