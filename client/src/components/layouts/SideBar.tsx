"use client";

import Logo from "../Logo";
import { LayoutDashboard, Settings } from "lucide-react";
import Link from "next/link";
import { dashBoardTools } from "@/utils/content";
import { usePathname } from "next/navigation";
import { cn } from "@/utils/tailwindcss-merger";

export default function SideBar() {
  const pathname = usePathname();

  return (
    <aside className="peer/sidebar group/sidebar fixed left-0 top-0 z-50 h-screen w-20 hover:w-64 transition-[width] duration-300 ease-in-out flex flex-col overflow-hidden bg-[hsl(var(--background))] border-r border-[hsl(var(--sidebar-border))] no-scrollbar">
      <div className="flex items-center h-16 border-b px-4 border-[hsl(var(--sidebar-border))]">
        <Link href="/" className="flex items-center gap-2 min-w-0">
          <Logo size="md" showText={false} />
          <span className="max-w-0 opacity-0 group-hover/sidebar:max-w-40 group-hover/sidebar:opacity-100 whitespace-nowrap overflow-hidden text-xl font-bold tracking-tight transition-all duration-200">
            <span className="gradient-text">Link</span>
            <span className="text-foreground">Lab</span>
          </span>
        </Link>
      </div>

      <nav className="flex flex-col gap-2 flex-1 overflow-y-auto p-4">
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center justify-center group-hover/sidebar:justify-start gap-2 px-2 group-hover/sidebar:px-3 py-2 rounded-lg min-h-10 transition-all text-muted-foreground hover:bg-gray-400/15",
            pathname === "/dashboard" &&
              "text-[hsl(var(--sidebar-primary))] bg-gray-400/15",
          )}
        >
          <LayoutDashboard className="w-5 h-5 shrink-0" />
          <span className="max-w-0 opacity-0 group-hover/sidebar:max-w-40 group-hover/sidebar:opacity-100 whitespace-nowrap overflow-hidden text-sm transition-all duration-200">
            Dashboard
          </span>
        </Link>

        <div className="max-h-0 opacity-0 overflow-hidden px-0 group-hover/sidebar:max-h-10 group-hover/sidebar:opacity-100 group-hover/sidebar:px-3 group-hover/sidebar:pt-4 text-xs uppercase text-muted-foreground transition-all duration-200">
          Tools
        </div>

        {dashBoardTools.map(({ name, href, icon: Icon }) => (
          <Link
            key={name}
            href={href}
            className={cn(
              "flex items-center justify-center group-hover/sidebar:justify-start text-sm gap-2 px-2 group-hover/sidebar:px-3 py-2 rounded-lg min-h-10 transition-all text-muted-foreground hover:bg-gray-400/15",
              pathname === href && "text-[hsl(var(--primary))] bg-gray-400/15",
            )}
          >
            <Icon className="w-5 h-5 shrink-0" />
            <span className="w-fit opacity-0 group-hover/sidebar:max-w-40 group-hover/sidebar:opacity-100 whitespace-nowrap overflow-hidden transition-all duration-200">
              {name}
            </span>
          </Link>
        ))}
      </nav>

      <div className="p-4">
        <Link
          href="/dashboard/settings"
          className={cn(
            "flex items-center justify-center group-hover/sidebar:justify-start gap-2 px-2 group-hover/sidebar:px-3 py-2 rounded-lg min-h-10 transition-all text-muted-foreground hover:bg-gray-400/15",
            pathname === "/dashboard/settings" &&
              "text-[hsl(var(--primary))] bg-gray-400/15",
          )}
        >
          <Settings className="h-5 w-5 shrink-0" />
          <span className="max-w-0 opacity-0 group-hover/sidebar:max-w-40 group-hover/sidebar:opacity-100 whitespace-nowrap overflow-hidden transition-all duration-200">
            Settings
          </span>
        </Link>
      </div>
    </aside>
  );
}
