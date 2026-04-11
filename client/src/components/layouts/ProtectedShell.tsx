"use client";

import { ReactNode, useEffect, useState } from "react";
import Header from "./Header";
import SideBar from "./SideBar";
import { cn } from "@/utils/tailwindcss-merger";

export default function ProtectedShell({
  children,
}: {
  children: ReactNode;
}) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isMobileSidebarOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileSidebarOpen]);

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <SideBar
        isMobileOpen={isMobileSidebarOpen}
        setIsMobileOpen={setIsMobileSidebarOpen}
      />

      <button
        type="button"
        aria-label="Close sidebar"
        className={cn(
          "fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 sm:hidden",
          isMobileSidebarOpen
            ? "opacity-100"
            : "pointer-events-none opacity-0",
        )}
        onClick={() => setIsMobileSidebarOpen(false)}
      />

      <div className="ml-0 min-h-screen transition-[margin] duration-300 ease-in-out sm:ml-20 sm:peer-hover/sidebar:ml-64">
        <Header setIsMobileSidebarOpen={setIsMobileSidebarOpen} />
        <main className="px-4 pb-4 pt-20 sm:px-6">
          {children}
        </main>
      </div>
    </div>
  );
}
