// "use client";

// import { Button } from "@/components/ui/Button";
// import { Input } from "@/components/ui/Input";
// import { Label } from "@/components/ui/Label";
// import { useToastNotification } from "@/utils/toast";
// import {
//   BarChart3,
//   Check,
//   Clock3,
//   Copy,
//   ExternalLink,
//   KeyRound,
//   Loader2,
//   Lock,
//   Shield,
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
//   writeStoredCollection,
// } from "../../lib/toolStorage";

// type OneTimeUrl = {
//   id: string;
//   url: string;
//   destination: string;
//   hasPassword: boolean;
//   isUsed: boolean;
//   createdAt: string;
//   copyCount: number;
// };

// const normalizeUrl = (value: string) =>
//   value.startsWith("http://") || value.startsWith("https://")
//     ? value
//     : `https://${value}`;

// const createShortCode = () => Math.random().toString(36).slice(2, 10);

// const OneTimeLink = () => {
//   const notify = useToastNotification();
//   const [destinationUrl, setDestinationUrl] = useState("");
//   const [password, setPassword] = useState("");
//   const [usePassword, setUsePassword] = useState(false);
//   const [isGenerating, setIsGenerating] = useState(false);
//   const [generatedLinks, setGeneratedLinks] = useState<OneTimeUrl[]>(() =>
//     readStoredCollection<OneTimeUrl>(DASHBOARD_STORAGE_KEYS.oneTimeLink),
//   );
//   const [copiedId, setCopiedId] = useState<string | null>(null);

//   useEffect(() => {
//     writeStoredCollection(DASHBOARD_STORAGE_KEYS.oneTimeLink, generatedLinks);
//   }, [generatedLinks]);

//   const analytics = useMemo(() => {
//     const activeLinks = generatedLinks.filter((link) => !link.isUsed).length;
//     const expiredLinks = generatedLinks.length - activeLinks;
//     const passwordProtected = generatedLinks.filter((link) => link.hasPassword).length;
//     const totalCopies = generatedLinks.reduce((sum, link) => sum + link.copyCount, 0);

//     return {
//       totalLinks: generatedLinks.length,
//       activeLinks,
//       expiredLinks,
//       passwordProtected,
//       totalCopies,
//       latestLink: generatedLinks[0] ?? null,
//     };
//   }, [generatedLinks]);

//   const generateLink = async () => {
//     if (!destinationUrl.trim()) {
//       notify("Enter a destination URL.", "warning");
//       return;
//     }

//     if (usePassword && !password.trim()) {
//       notify("Enter a password or turn protection off.", "warning");
//       return;
//     }

//     setIsGenerating(true);
//     await new Promise((resolve) => setTimeout(resolve, 750));

//     const nextLink: OneTimeUrl = {
//       id: crypto.randomUUID(),
//       url: `https://linklab.app/once/${createShortCode()}`,
//       destination: normalizeUrl(destinationUrl.trim()),
//       hasPassword: usePassword,
//       isUsed: false,
//       createdAt: new Date().toISOString(),
//       copyCount: 0,
//     };

//     setGeneratedLinks((previous) => [nextLink, ...previous].slice(0, 24));
//     setDestinationUrl("");
//     setPassword("");
//     setUsePassword(false);
//     setIsGenerating(false);
//     notify("One-time link created.", "success");
//   };

//   const copyLink = async (id: string, url: string) => {
//     try {
//       await navigator.clipboard.writeText(url);
//       setCopiedId(id);
//       setGeneratedLinks((previous) =>
//         previous.map((link) =>
//           link.id === id ? { ...link, copyCount: link.copyCount + 1 } : link,
//         ),
//       );
//       notify("Link copied.", "success");
//       setTimeout(
//         () => setCopiedId((current) => (current === id ? null : current)),
//         1800,
//       );
//     } catch {
//       notify("Unable to copy the link.", "error");
//     }
//   };

//   const markAsUsed = (id: string) => {
//     setGeneratedLinks((previous) =>
//       previous.map((link) =>
//         link.id === id ? { ...link, isUsed: true } : link,
//       ),
//     );
//     notify("Link marked as used.", "success");
//   };

//   return (
//     <ToolPageShell
//       icon={KeyRound}
//       heading="One-Time Link Generator"
//       para="Create secure links that expire after a single use."
//       iconClassName="h-6 w-6 text-primary"
//     >
//       <div className="space-y-6">
//         <div className="grid gap-6 xl:grid-cols-[minmax(0,0.96fr)_minmax(0,1.04fr)]">
//           <ToolPanel
//             heading="Create One-Time Link"
//             para="Generate single-access links for sensitive destinations, with optional password protection."
//             headerSlot={<ToolFeaturePill icon={Shield} label="Single-use access" />}
//           >
//             <ToolPillGroup className="mb-5">
//               <ToolFeaturePill icon={Clock3} label="Expires on first open" />
//               <ToolFeaturePill icon={Lock} label="Optional password" />
//               <ToolFeaturePill icon={KeyRound} label="Share securely" />
//             </ToolPillGroup>

//             <div className="space-y-4">
//               <div className="grid gap-2">
//                 <Label htmlFor="destination-url">Destination URL</Label>
//                 <Input
//                   id="destination-url"
//                   placeholder="https://example.com/secret-page"
//                   value={destinationUrl}
//                   onChange={(event) => setDestinationUrl(event.target.value)}
//                 />
//               </div>

//               <ToolInfoCard className="bg-[hsl(var(--secondary)/0.24)]">
//                 <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
//                   <div className="space-y-1">
//                     <p className="font-medium">Password protection</p>
//                     <p className="text-sm text-[hsl(var(--muted-foreground)/0.84)]">
//                       Require a password before the recipient can access the destination.
//                     </p>
//                   </div>

//                   <button
//                     type="button"
//                     aria-pressed={usePassword}
//                     onClick={() => setUsePassword((current) => !current)}
//                     className={`inline-flex h-11 min-w-[124px] items-center justify-center rounded-xl border px-4 text-sm font-medium transition-colors ${
//                       usePassword
//                         ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
//                         : "border-[hsl(var(--border))] bg-[hsl(var(--background))]"
//                     }`}
//                   >
//                     {usePassword ? "Protection On" : "Protection Off"}
//                   </button>
//                 </div>
//               </ToolInfoCard>

//               {usePassword ? (
//                 <div className="grid gap-2">
//                   <Label htmlFor="one-time-password">Password</Label>
//                   <Input
//                     id="one-time-password"
//                     type="password"
//                     placeholder="Enter access password"
//                     value={password}
//                     onChange={(event) => setPassword(event.target.value)}
//                   />
//                 </div>
//               ) : null}

//               <Button
//                 onClick={generateLink}
//                 disabled={isGenerating}
//                 className="w-full sm:w-auto"
//               >
//                 {isGenerating ? (
//                   <>
//                     <Loader2 className="h-4 w-4 animate-spin" />
//                     Generating...
//                   </>
//                 ) : (
//                   <>
//                     <KeyRound className="h-4 w-4" />
//                     Generate One-Time Link
//                   </>
//                 )}
//               </Button>
//             </div>
//           </ToolPanel>

//           <ToolPanel
//             heading="Generated Links"
//             para={
//               generatedLinks.length
//                 ? "Manage your recent single-use links and simulate expiration."
//                 : "Generated links will appear here after you create them."
//             }
//             headerSlot={
//               generatedLinks.length ? (
//                 <ToolFeaturePill
//                   icon={Clock3}
//                   label={`${generatedLinks.length} created`}
//                 />
//               ) : undefined
//             }
//           >
//             {generatedLinks.length ? (
//               <div className="space-y-3">
//                 {generatedLinks.map((link) => (
//                   <article
//                     key={link.id}
//                     className={`rounded-2xl border p-4 ${
//                       link.isUsed
//                         ? "border-rose-500/30 bg-rose-500/8"
//                         : "border-[hsl(var(--border))] bg-[hsl(var(--secondary)/0.24)]"
//                     }`}
//                   >
//                     <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
//                       <div className="min-w-0 flex-1 space-y-2">
//                         <p
//                           className={`break-all text-sm font-semibold ${
//                             link.isUsed
//                               ? "text-[hsl(var(--muted-foreground))] line-through"
//                               : "text-[hsl(var(--primary))]"
//                           }`}
//                         >
//                           {link.url}
//                         </p>
//                         <p className="break-all text-sm text-[hsl(var(--muted-foreground)/0.88)]">
//                           {link.destination}
//                         </p>

//                         <ToolPillGroup>
//                           <ToolFeaturePill
//                             icon={Clock3}
//                             label={link.isUsed ? "Expired" : "Active"}
//                             className={
//                               link.isUsed
//                                 ? "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300"
//                                 : "border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
//                             }
//                           />
//                           <ToolFeaturePill
//                             icon={Lock}
//                             label={link.hasPassword ? "Password protected" : "No password"}
//                           />
//                           <ToolFeaturePill label={`${link.copyCount} copies`} />
//                           <ToolFeaturePill label={formatDashboardDate(link.createdAt)} />
//                         </ToolPillGroup>
//                       </div>

//                       <ToolPillGroup>
//                         <Button
//                           variant="outline"
//                           size="sm"
//                           onClick={() => copyLink(link.id, link.url)}
//                           disabled={link.isUsed}
//                         >
//                           {copiedId === link.id ? (
//                             <Check className="h-4 w-4" />
//                           ) : (
//                             <Copy className="h-4 w-4" />
//                           )}
//                           {copiedId === link.id ? "Copied" : "Copy"}
//                         </Button>

//                         <Button variant="outline" size="sm" asChild>
//                           <a
//                             href={link.destination}
//                             target="_blank"
//                             rel="noopener noreferrer"
//                           >
//                             <ExternalLink className="h-4 w-4" />
//                             Destination
//                           </a>
//                         </Button>

//                         <Button
//                           variant="outline"
//                           size="sm"
//                           onClick={() => markAsUsed(link.id)}
//                           disabled={link.isUsed}
//                         >
//                           <Clock3 className="h-4 w-4" />
//                           {link.isUsed ? "Expired" : "Mark Used"}
//                         </Button>
//                       </ToolPillGroup>
//                     </div>
//                   </article>
//                 ))}
//               </div>
//             ) : (
//               <ToolEmptyState
//                 icon={KeyRound}
//                 title="No one-time links yet"
//                 description="Create a secure single-use URL and it will appear here with copy and expiry actions."
//               />
//             )}
//           </ToolPanel>
//         </div>

//         <ToolPanel
//           heading="One-Time Link Analytics"
//           para="Track how many secure links you created, how many are still active, how many are password protected, and how often they were copied."
//           headerSlot={<ToolFeaturePill icon={BarChart3} label="One-time link metrics" />}
//         >
//           {generatedLinks.length ? (
//             <div className="space-y-5">
//               <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
//                 <ToolMetricCard
//                   label="Created"
//                   value={analytics.totalLinks}
//                   valueClassName="text-2xl"
//                 />
//                 <ToolMetricCard
//                   label="Active"
//                   value={analytics.activeLinks}
//                   valueClassName="text-2xl"
//                 />
//                 <ToolMetricCard
//                   label="Expired"
//                   value={analytics.expiredLinks}
//                   valueClassName="text-2xl"
//                 />
//                 <ToolMetricCard
//                   label="Protected"
//                   value={analytics.passwordProtected}
//                   valueClassName="text-2xl"
//                 />
//                 <ToolMetricCard
//                   label="Copies"
//                   value={analytics.totalCopies}
//                   valueClassName="text-2xl"
//                 />
//               </div>

//               {analytics.latestLink ? (
//                 <ToolInfoCard
//                   eyebrow="Latest generated link"
//                   title={analytics.latestLink.url}
//                   description={`Created ${formatDashboardDate(analytics.latestLink.createdAt)} and routed to ${analytics.latestLink.destination}`}
//                   titleClassName="break-all font-mono text-sm"
//                   descriptionClassName="break-all"
//                 />
//               ) : null}
//             </div>
//           ) : (
//             <ToolEmptyState
//               icon={BarChart3}
//               title="No one-time link analytics yet"
//               description="Create a few links and the analytics snapshot will appear here."
//             />
//           )}
//         </ToolPanel>
//       </div>
//     </ToolPageShell>
//   );
// };

// export default OneTimeLink;
