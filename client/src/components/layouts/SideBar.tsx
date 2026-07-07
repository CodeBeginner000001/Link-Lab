"use client";

import Logo from "../Logo";
import { ChevronLeft, LayoutDashboard, Settings } from "lucide-react";
import Link from "next/link";
import { dashBoardTools } from "@/utils/content";
import { usePathname } from "next/navigation";
import { cn } from "@/utils/tailwindcss-merger";
import { Dispatch, SetStateAction, useEffect, useState } from "react";

interface SideBarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: Dispatch<SetStateAction<boolean>>;
}

export default function SideBar({
  isMobileOpen,
  setIsMobileOpen,
}: SideBarProps) {
  const pathname = usePathname();
  const [isDesktopExpanded, setIsDesktopExpanded] = useState(false);
  const isExpanded = isMobileOpen || isDesktopExpanded;

  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname, setIsMobileOpen]);

  return (
    <aside
      onMouseEnter={() => setIsDesktopExpanded(true)}
      onMouseLeave={() => setIsDesktopExpanded(false)}
      className={cn(
        "peer/sidebar fixed left-0 top-0 z-50 flex h-screen w-64 flex-col overflow-hidden border-r border-[hsl(var(--sidebar-border))] bg-[hsl(var(--background))] no-scrollbar transition-transform duration-300 ease-in-out sm:translate-x-0 sm:transition-[width]",
        isMobileOpen ? "translate-x-0" : "-translate-x-full",
        isDesktopExpanded ? "sm:w-64" : "sm:w-20",
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-[hsl(var(--sidebar-border))] px-4">
        <Link href="/" className="flex items-center gap-2 min-w-0">
          <Logo size="sm" showText={false} />
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

        <button
          type="button"
          onClick={() => setIsMobileOpen(false)}
          className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-gray-400/15 hover:text-foreground sm:hidden"
          aria-label="Close sidebar"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex flex-col gap-2 flex-1 overflow-y-auto p-4">
        <Link
          href="/dashboard"
          prefetch={false}
          onClick={() => setIsMobileOpen(false)}
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
            prefetch={false}
            onClick={() => setIsMobileOpen(false)}
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

      {/* <div className="p-4">
        <Link
          href="/dashboard/settings"
          onClick={() => setIsMobileOpen(false)}
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
      </div> */}
    </aside>
  );
}
