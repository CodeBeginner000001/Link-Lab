// "use client";

// import { useAuth } from "@/Provider/AuthUserProvider";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/Avatar";
// import { Button } from "@/components/ui/Button";
// import { useTheme } from "@/context/ThemeContext";
// import type { Theme } from "@/interfaces/context";
// import { Logout } from "@/service/auth";
// import { dashBoardTools } from "@/utils/content";
// import { cn } from "@/utils/tailwindcss-merger";
// import { useToastNotification } from "@/utils/toast";
// import {
//   ArrowRight,
//   Database,
//   LayoutDashboard,
//   LogOut,
//   Mail,
//   MonitorCog,
//   RotateCcw,
//   Settings,
//   ShieldCheck,
//   Sparkles,
//   Trash2,
//   UserRound,
// } from "lucide-react";
// import Link from "next/link";
// import { useRouter } from "next/navigation";
// import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
// import ToolConfirmModal from "../common/ToolConfirmModal";
// import ToolEmptyState from "../common/ToolEmptyState";
// import ToolFeaturePill from "../common/ToolFeaturePill";
// import ToolInfoCard from "../common/ToolInfoCard";
// import ToolLoadingState from "../common/ToolLoadingState";
// import ToolMetricCard from "../common/ToolMetricCard";
// import ToolPageShell from "../common/ToolPageShell";
// import ToolPanel from "../common/ToolPanel";
// import ToolPillGroup from "../common/ToolPillGroup";
// import ToolSegmentedTabs from "../common/ToolSegmentedTabs";
// import {
//   DASHBOARD_STORAGE_KEYS,
//   DEFAULT_DASHBOARD_PREFERENCES,
//   type DashboardPreferences,
//   isDashboardPreferences,
//   readStoredCollection,
//   readStoredValue,
//   writeStoredValue,
// } from "../../lib/toolStorage";

// type ConfirmMode = "history" | "preferences" | null;

// type WorkspaceMetricConfig = {
//   label: string;
//   key: string;
//   href: string;
// };

// type WorkspaceMetric = WorkspaceMetricConfig & {
//   count: number;
// };

// const WORKSPACE_METRICS: WorkspaceMetricConfig[] = [
//   {
//     label: "QR Code Generator",
//     key: DASHBOARD_STORAGE_KEYS.qrGenerator,
//     href: "/dashboard/qr-generator",
//   },
//   {
//     label: "QR Code Scanner",
//     key: DASHBOARD_STORAGE_KEYS.qrScanner,
//     href: "/dashboard/qr-scanner",
//   },
//   {
//     label: "Barcode Decoder",
//     key: DASHBOARD_STORAGE_KEYS.barcodeDecoder,
//     href: "/dashboard/barcode-decoder",
//   },
//   {
//     label: "Barcode Generator",
//     key: DASHBOARD_STORAGE_KEYS.barcodeGenerator,
//     href: "/dashboard/barcode-generator",
//   },
//   {
//     label: "Link Expander",
//     key: DASHBOARD_STORAGE_KEYS.linkExpander,
//     href: "/dashboard/link-expander",
//   },
//   {
//     label: "Dynamic QR Generator",
//     key: DASHBOARD_STORAGE_KEYS.dynamicQr,
//     href: "/dashboard/dynamic-qr",
//   },
//   {
//     label: "One-Time Link",
//     key: DASHBOARD_STORAGE_KEYS.oneTimeLink,
//     href: "/dashboard/one-time-link",
//   },
// ];

// const THEME_OPTIONS = [
//   { label: "System", value: "system" },
//   { label: "Light", value: "light" },
//   { label: "Dark", value: "dark" },
// ];

// const ACTIVITY_LIMIT_OPTIONS = [
//   { label: "4 items", value: "4" },
//   { label: "8 items", value: "8" },
//   { label: "12 items", value: "12" },
// ];

// const getInitials = (name?: string | null) => {
//   if (!name?.trim()) {
//     return "LL";
//   }

//   const parts = name.trim().split(/\s+/).slice(0, 2);
//   return parts.map((part) => part[0]?.toUpperCase() ?? "").join("") || "LL";
// };

// const getWorkspaceMetrics = (): WorkspaceMetric[] =>
//   WORKSPACE_METRICS.map((metric) => ({
//     ...metric,
//     count: readStoredCollection<unknown>(metric.key).length,
//   }));

// const isTheme = (value: string): value is Theme =>
//   value === "system" || value === "light" || value === "dark";

// export default function UserSettingsClient() {
//   const hasHydrated = useSyncExternalStore(
//     () => () => undefined,
//     () => true,
//     () => false,
//   );

//   if (!hasHydrated) {
//     return (
//       <ToolPageShell
//         icon={Settings}
//         heading="User Settings"
//         para="Manage account visibility, appearance, dashboard behavior, and the local workspace data behind your analytics panels."
//         iconClassName="h-6 w-6 text-primary"
//       >
//         <ToolLoadingState
//           title="Loading settings"
//           description="Preparing your saved preferences and local workspace summary."
//           icon={Settings}
//         />
//       </ToolPageShell>
//     );
//   }

//   return <HydratedUserSettingsContent />;
// }

// function HydratedUserSettingsContent() {
//   const user = useAuth();
//   const router = useRouter();
//   const notify = useToastNotification();
//   const { theme, resolvedTheme, setTheme } = useTheme();

//   const [preferences, setPreferences] = useState<DashboardPreferences>(
//     () =>
//       readStoredValue(
//         DASHBOARD_STORAGE_KEYS.settings,
//         DEFAULT_DASHBOARD_PREFERENCES,
//         isDashboardPreferences,
//       ),
//   );
//   const [workspaceMetrics, setWorkspaceMetrics] = useState<WorkspaceMetric[]>(
//     () => getWorkspaceMetrics(),
//   );
//   const [confirmMode, setConfirmMode] = useState<ConfirmMode>(null);
//   const [confirmValue, setConfirmValue] = useState("");
//   const [isLoggingOut, setIsLoggingOut] = useState(false);

//   useEffect(() => {
//     writeStoredValue(DASHBOARD_STORAGE_KEYS.settings, preferences);
//   }, [preferences]);

//   const preferredTool = useMemo(() => {
//     return (
//       dashBoardTools.find((tool) => tool.href === preferences.preferredToolHref) ??
//       dashBoardTools[0]
//     );
//   }, [preferences.preferredToolHref]);

//   const totalLocalRecords = useMemo(() => {
//     return workspaceMetrics.reduce((sum, metric) => sum + metric.count, 0);
//   }, [workspaceMetrics]);

//   const toolsWithHistory = useMemo(() => {
//     return workspaceMetrics.filter((metric) => metric.count > 0);
//   }, [workspaceMetrics]);

//   const largestTool = useMemo(() => {
//     return [...toolsWithHistory].sort((firstMetric, secondMetric) => {
//       return secondMetric.count - firstMetric.count;
//     })[0] ?? null;
//   }, [toolsWithHistory]);

//   const themeLabel =
//     theme === "system" ? `System (${resolvedTheme})` : theme;

//   const appearanceSummary =
//     theme === "system"
//       ? `Following your device preference. ${resolvedTheme === "dark" ? "Dark" : "Light"} mode is active right now.`
//       : `The dashboard stays in ${theme} mode on this browser until you change it again.`;

//   const closeConfirmModal = () => {
//     setConfirmMode(null);
//     setConfirmValue("");
//   };

//   const handleThemeChange = (value: string) => {
//     if (!isTheme(value) || value === theme) {
//       return;
//     }

//     setTheme(value);
//   };

//   const handleActivityLimitChange = (value: string) => {
//     if (value !== "4" && value !== "8" && value !== "12") {
//       return;
//     }

//     setPreferences((currentPreferences) => ({
//       ...currentPreferences,
//       recentActivityLimit: Number(value) as DashboardPreferences["recentActivityLimit"],
//     }));
//   };

//   const handleClearHistory = () => {
//     if (typeof window !== "undefined") {
//       WORKSPACE_METRICS.forEach((metric) => {
//         window.localStorage.removeItem(metric.key);
//       });
//     }

//     setWorkspaceMetrics(getWorkspaceMetrics());
//     closeConfirmModal();
//     notify("Local dashboard history cleared.", "success");
//   };

//   const handleResetPreferences = () => {
//     setPreferences({ ...DEFAULT_DASHBOARD_PREFERENCES });
//     closeConfirmModal();
//     notify("Dashboard preferences reset.", "success");
//   };

//   const handleLogOut = async () => {
//     if (isLoggingOut) {
//       return;
//     }

//     setIsLoggingOut(true);
//     const logOutResult = await Logout();
//     setIsLoggingOut(false);

//     if ("result" in logOutResult && logOutResult.result?.success) {
//       notify(logOutResult.result.data.message, "success");
//       router.replace("/login");
//       router.refresh();
//       return;
//     }

//     const message =
//       "error" in logOutResult
//         ? Array.isArray(logOutResult.error?.message)
//           ? logOutResult.error.message[0]
//           : logOutResult.error?.message
//         : "Unable to logout";

//     notify(message || "Unable to logout", "error");
//   };

//   return (
//     <ToolPageShell
//       icon={Settings}
//       heading="User Settings"
//       para="Manage account visibility, appearance, dashboard behavior, and the local workspace data behind your analytics panels."
//       iconClassName="h-6 w-6 text-primary"
//     >
//       <div className="space-y-6">
//         <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
//           <ToolPanel
//             heading="Account"
//             para="Signed-in identity for this protected workspace plus a quick view of your current dashboard defaults."
//             headerSlot={<ToolFeaturePill icon={UserRound} label="Signed-in profile" />}
//           >
//             <div className="space-y-5">
//               <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
//                 <Avatar className="h-20 w-20 border border-[hsl(var(--border))]">
//                   <AvatarImage
//                     src={user?.avatar || undefined}
//                     className="object-cover"
//                   />
//                   <AvatarFallback className="text-lg font-semibold">
//                     {getInitials(user?.name)}
//                   </AvatarFallback>
//                 </Avatar>

//                 <div className="min-w-0 space-y-1">
//                   <p className="truncate text-xl font-semibold text-[hsl(var(--foreground))]">
//                     {user?.name ?? "LinkLab User"}
//                   </p>
//                   <p className="truncate text-sm text-[hsl(var(--muted-foreground)/0.88)]">
//                     {user?.email ?? "Signed-in workspace"}
//                   </p>
//                 </div>
//               </div>

//               <ToolPillGroup>
//                 {user?.email ? (
//                   <ToolFeaturePill icon={Mail} label={user.email} />
//                 ) : null}
//                 <ToolFeaturePill label={`Preferred tool: ${preferredTool.name}`} />
//                 <ToolFeaturePill
//                   label={`Feed size: ${preferences.recentActivityLimit}`}
//                 />
//               </ToolPillGroup>

//               <div className="grid gap-3 sm:grid-cols-2">
//                 <ToolMetricCard
//                   label="Theme"
//                   value={themeLabel}
//                   valueClassName="text-base capitalize"
//                 />
//                 <ToolMetricCard
//                   label="Local Records"
//                   value={totalLocalRecords}
//                   valueClassName="text-2xl"
//                 />
//               </div>

//               <ToolInfoCard
//                 eyebrow="Scope"
//                 title="Profile data is currently read-only here."
//                 description="Account identity comes from the authenticated session. The adjustable controls on this page are appearance, dashboard defaults, and local workspace data."
//               />
//             </div>
//           </ToolPanel>

//           <ToolPanel
//             heading="Appearance"
//             para="Choose how the dashboard should render on this browser."
//             headerSlot={
//               <ToolFeaturePill icon={MonitorCog} label="Device preference aware" />
//             }
//           >
//             <div className="space-y-5">
//               <ToolSegmentedTabs
//                 options={THEME_OPTIONS}
//                 value={theme}
//                 onValueChange={handleThemeChange}
//               />

//               <ToolInfoCard
//                 eyebrow="Current mode"
//                 title={theme === "system" ? "System controlled theme" : `${themeLabel} mode`}
//                 description={appearanceSummary}
//               />

//               <div className="grid gap-3 sm:grid-cols-3">
//                 {THEME_OPTIONS.map((option) => {
//                   const isSelected = option.value === theme;

//                   return (
//                     <ToolInfoCard
//                       key={option.value}
//                       eyebrow={option.label}
//                       title={isSelected ? "Selected" : "Available"}
//                       description={
//                         option.value === "system"
//                           ? "Switch automatically with the operating system."
//                           : `Force ${option.label.toLowerCase()} mode for the dashboard.`
//                       }
//                       className={cn(
//                         "border-[hsl(var(--border))] transition-colors",
//                         isSelected
//                           ? "border-[hsl(var(--primary)/0.45)] bg-[hsl(var(--primary)/0.08)]"
//                           : "bg-[hsl(var(--secondary)/0.24)]",
//                       )}
//                     />
//                   );
//                 })}
//               </div>
//             </div>
//           </ToolPanel>
//         </div>

//         <div className="grid gap-6 xl:grid-cols-[minmax(0,1.02fr)_minmax(320px,0.98fr)]">
//           <ToolPanel
//             heading="Dashboard Preferences"
//             para="Control which tool is promoted on the overview page and how much recent activity it shows."
//             headerSlot={<ToolFeaturePill icon={Sparkles} label="Personalized defaults" />}
//           >
//             <div className="space-y-5">
//               <div className="space-y-3">
//                 <p className="text-sm font-medium text-[hsl(var(--foreground))]">
//                   Preferred launch tool
//                 </p>

//                 <div className="grid gap-3 md:grid-cols-2">
//                   {dashBoardTools.map((tool) => {
//                     const Icon = tool.icon;
//                     const isSelected = tool.href === preferences.preferredToolHref;

//                     return (
//                       <button
//                         key={tool.href}
//                         type="button"
//                         onClick={() =>
//                           setPreferences((currentPreferences) => ({
//                             ...currentPreferences,
//                             preferredToolHref: tool.href,
//                           }))
//                         }
//                         className={cn(
//                           "flex items-center gap-3 rounded-2xl border px-4 py-4 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--ring))] focus-visible:ring-offset-0",
//                           isSelected
//                             ? "border-[hsl(var(--primary)/0.45)] bg-[hsl(var(--primary)/0.08)]"
//                             : "border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.22)] hover:border-[hsl(var(--primary)/0.28)] hover:bg-[hsl(var(--secondary)/0.34)]",
//                         )}
//                       >
//                         <div className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-3">
//                           <Icon className="h-5 w-5 text-[hsl(var(--foreground))]" />
//                         </div>

//                         <div className="min-w-0">
//                           <p className="text-sm font-semibold text-[hsl(var(--foreground))]">
//                             {tool.name}
//                           </p>
//                           <p className="mt-1 text-xs text-[hsl(var(--muted-foreground)/0.85)]">
//                             {isSelected ? "Current launch target" : "Use as dashboard shortcut"}
//                           </p>
//                         </div>
//                       </button>
//                     );
//                   })}
//                 </div>
//               </div>

//               <div className="space-y-3">
//                 <p className="text-sm font-medium text-[hsl(var(--foreground))]">
//                   Recent activity feed size
//                 </p>
//                 <ToolSegmentedTabs
//                   options={ACTIVITY_LIMIT_OPTIONS}
//                   value={String(preferences.recentActivityLimit)}
//                   onValueChange={handleActivityLimitChange}
//                 />
//                 <p className="text-sm text-[hsl(var(--muted-foreground)/0.85)]">
//                   The dashboard overview will show up to{" "}
//                   {preferences.recentActivityLimit} saved actions in the cross-tool
//                   activity timeline.
//                 </p>
//               </div>

//               <ToolInfoCard
//                 eyebrow="Selected launch path"
//                 title={preferredTool.name}
//                 description={`${preferredTool.href} is now your preferred dashboard shortcut.`}
//               />

//               <div className="flex flex-wrap gap-2.5">
//                 <Button asChild>
//                   <Link href="/dashboard">
//                     Open Dashboard
//                     <ArrowRight className="h-4 w-4" />
//                   </Link>
//                 </Button>

//                 <Button variant="outline" asChild>
//                   <Link href={preferredTool.href}>Open {preferredTool.name}</Link>
//                 </Button>

//                 <Button
//                   variant="outline"
//                   onClick={() => setConfirmMode("preferences")}
//                 >
//                   <RotateCcw className="h-4 w-4" />
//                   Reset Preferences
//                 </Button>
//               </div>
//             </div>
//           </ToolPanel>

//           <div className="space-y-6">
//             <ToolPanel
//               heading="Workspace Data"
//               para="Review the local records currently powering your dashboard analytics panels."
//               headerSlot={
//                 <ToolPillGroup>
//                   <ToolFeaturePill
//                     icon={Database}
//                     label={`${totalLocalRecords} local records`}
//                   />
//                   <ToolFeaturePill label="URL Shortener stays server-backed" />
//                 </ToolPillGroup>
//               }
//             >
//               {totalLocalRecords ? (
//                 <div className="space-y-5">
//                   <div className="grid gap-3 sm:grid-cols-3">
//                     <ToolMetricCard
//                       label="Local Records"
//                       value={totalLocalRecords}
//                       valueClassName="text-2xl"
//                     />
//                     <ToolMetricCard
//                       label="Tools With History"
//                       value={toolsWithHistory.length}
//                       valueClassName="text-2xl"
//                     />
//                     <ToolMetricCard
//                       label="Largest Library"
//                       value={largestTool?.label ?? "None yet"}
//                       valueClassName="text-sm"
//                     />
//                   </div>

//                   <div className="grid gap-3 md:grid-cols-2">
//                     {workspaceMetrics.map((metric) => (
//                       <ToolInfoCard
//                         key={metric.key}
//                         eyebrow="Local records"
//                         title={metric.label}
//                         description={
//                           metric.count
//                             ? `${metric.count} saved ${metric.count === 1 ? "record" : "records"} on this browser.`
//                             : "No saved records on this browser yet."
//                         }
//                         className={cn(
//                           metric.count
//                             ? "bg-[hsl(var(--secondary)/0.22)]"
//                             : "bg-[hsl(var(--secondary)/0.12)]",
//                         )}
//                       >
//                         <Button variant="outline" asChild className="w-full">
//                           <Link href={metric.href}>Open Tool</Link>
//                         </Button>
//                       </ToolInfoCard>
//                     ))}
//                   </div>

//                   <ToolInfoCard
//                     eyebrow="Not included"
//                     title="Server-backed data stays untouched."
//                     description="URL Shortener analytics are stored on the backend and are not cleared by this local workspace reset."
//                   />

//                   <Button
//                     variant="destructive"
//                     onClick={() => setConfirmMode("history")}
//                     className="w-full sm:w-auto"
//                   >
//                     <Trash2 className="h-4 w-4" />
//                     Clear Local Tool History
//                   </Button>
//                 </div>
//               ) : (
//                 <ToolEmptyState
//                   icon={Database}
//                   title="No local history stored yet"
//                   description="Create records in the generator, scanner, and link tools to populate the dashboard analytics panels on this browser."
//                 >
//                   <Button variant="outline" asChild>
//                     <Link href={preferredTool.href}>Open {preferredTool.name}</Link>
//                   </Button>
//                 </ToolEmptyState>
//               )}
//             </ToolPanel>

//             <ToolPanel
//               heading="Security & Access"
//               para="Control the current session on this browser."
//               headerSlot={<ToolFeaturePill icon={ShieldCheck} label="Session controls" />}
//             >
//               <div className="space-y-5">
//                 <ToolInfoCard
//                   eyebrow="Password management"
//                   title="Credential changes use the reset-password flow."
//                   description="LinkLab does not expose an inline password editor here yet. Sign out on this device when you are done, or use the reset-password flow from the auth screens when needed."
//                 />

//                 <div className="grid gap-3 sm:grid-cols-2">
//                   <ToolMetricCard
//                     label="Signed In As"
//                     value={user?.email ?? "Authenticated user"}
//                     valueClassName="text-sm"
//                   />
//                   <ToolMetricCard
//                     label="Workspace Scope"
//                     value="This browser session"
//                     valueClassName="text-sm"
//                   />
//                 </div>

//                 <div className="flex flex-wrap gap-2.5">
//                   <Button variant="outline" asChild>
//                     <Link href="/dashboard">
//                       <LayoutDashboard className="h-4 w-4" />
//                       Back to Dashboard
//                     </Link>
//                   </Button>

//                   <Button
//                     variant="destructive"
//                     onClick={handleLogOut}
//                     disabled={isLoggingOut}
//                   >
//                     <LogOut className="h-4 w-4" />
//                     {isLoggingOut ? "Signing Out..." : "Sign Out"}
//                   </Button>
//                 </div>
//               </div>
//             </ToolPanel>
//           </div>
//         </div>
//       </div>

//       <ToolConfirmModal
//         isOpen={confirmMode !== null}
//         eyebrow={
//           confirmMode === "history"
//             ? "Clear Local History"
//             : "Reset Preferences"
//         }
//         title={
//           confirmMode === "history"
//             ? "Confirm local data reset"
//             : "Reset dashboard defaults"
//         }
//         subjectLabel={
//           confirmMode === "history"
//             ? "This will remove local records for:"
//             : "This will reset:"
//         }
//         subjectValue={
//           confirmMode === "history"
//             ? "QR Generator, QR Scanner, Barcode Decoder, Barcode Generator, Link Expander, Dynamic QR, and One-Time Link history on this browser."
//             : "Preferred launch tool and recent activity feed size."
//         }
//         confirmValue={confirmValue}
//         confirmKeyword="reset"
//         confirmLabel={
//           confirmMode === "history"
//             ? "Clear Local History"
//             : "Reset Preferences"
//         }
//         onConfirmValueChange={setConfirmValue}
//         onClose={closeConfirmModal}
//         onConfirm={
//           confirmMode === "history"
//             ? handleClearHistory
//             : handleResetPreferences
//         }
//         cancelLabel="Keep Settings"
//       />
//     </ToolPageShell>
//   );
// }
