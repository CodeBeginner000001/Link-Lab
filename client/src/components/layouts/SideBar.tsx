"use client";

import Logo from "../Logo";
import { LayoutDashboard, Settings } from "lucide-react";
import Link from "next/link";
import { dashBoardTools } from "@/utils/content";
import { usePathname } from "next/navigation";
import { cn } from "@/utils/tailwindcss-merger";
import { useState } from "react";

export default function SideBar() {
  const pathname = usePathname();
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <aside
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
      className={cn(
        "fixed left-0 top-0 z-50 h-screen transition-[width] duration-300 ease-in-out flex flex-col overflow-hidden bg-[hsl(var(--background))] border-r border-[hsl(var(--sidebar-border))] no-scrollbar",
        isExpanded ? "w-64" : "w-20",
      )}
    >
      <div className="flex items-center h-16 border-b px-4 border-[hsl(var(--sidebar-border))]">
        <Link href="/" className="flex items-center gap-2 min-w-0">
          <Logo size="md" showText={false} />
          <span
            className={cn(
              "whitespace-nowrap overflow-hidden text-xl font-bold tracking-tight transition-all duration-200",
              isExpanded ? "max-w-40 opacity-100" : "max-w-0 opacity-0",
            )}
          >
            <span className="gradient-text">Link</span>
            <span className="text-foreground">Lab</span>
          </span>
        </Link>
      </div>

      <nav className="flex flex-col gap-2 flex-1 overflow-y-auto p-4">
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center gap-2 py-2 rounded-lg min-h-10 transition-all text-muted-foreground hover:bg-gray-400/15",
            isExpanded ? "justify-start px-3" : "justify-center px-2",
            pathname === "/dashboard" &&
              "text-[hsl(var(--sidebar-primary))] bg-gray-400/15",
          )}
        >
          <LayoutDashboard className="w-5 h-5 shrink-0" />
          <span
            className={cn(
              "whitespace-nowrap overflow-hidden text-sm transition-all duration-200",
              isExpanded ? "max-w-40 visible" : "max-w-0 hidden",
            )}
          >
            Dashboard
          </span>
        </Link>

        <div
          className={cn(
            "overflow-hidden text-xs uppercase text-muted-foreground transition-all duration-200",
            isExpanded
              ? "max-h-10 opacity-100 px-3 pt-4"
              : "max-h-0 opacity-0 px-0 pt-0",
          )}
        >
          Tools
        </div>

        {dashBoardTools.map(({ name, href, icon: Icon }) => (
          <Link
            key={name}
            href={href}
            className={cn(
              "flex items-center text-sm gap-2 py-2 rounded-lg min-h-10 transition-all text-muted-foreground hover:bg-gray-400/15",
              isExpanded ? "justify-start px-3" : "justify-center px-2",
              pathname === href && "text-[hsl(var(--primary))] bg-gray-400/15",
            )}
          >
            <Icon className="w-5 h-5 shrink-0" />
            <span
              className={cn(
                "whitespace-nowrap overflow-hidden transition-all duration-200",
                isExpanded ? "max-w-40 visible" : "max-w-0 hidden",
              )}
            >
              {name}
            </span>
          </Link>
        ))}
      </nav>

      <div className="p-4">
        <Link
          href="/dashboard/settings"
          className={cn(
            "flex items-center gap-2 py-2 rounded-lg min-h-10 transition-all text-muted-foreground hover:bg-gray-400/15",
            isExpanded ? "justify-start px-3" : "justify-center px-2",
            pathname === "/dashboard/settings" &&
              "text-[hsl(var(--primary))] bg-gray-400/15",
          )}
        >
          <Settings className="h-5 w-5 shrink-0" />
          <span
            className={cn(
              "whitespace-nowrap overflow-hidden transition-all duration-200",
              isExpanded ? "max-w-40 opacity-100" : "max-w-0 opacity-0",
            )}
          >
            Settings
          </span>
        </Link>
      </div>
    </aside>
  );
}
