"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import Logo from "../Logo";
import { LayoutDashboard, Settings } from "lucide-react";
import Link from "next/link";
import { dashBoardTools } from "@/utils/content";
import { usePathname } from "next/navigation";
import { cn } from "@/utils/tailwindcss-merger";

export default function SideBar() {
  const [isHovered, setIsHovered] = useState(false);
  const pathname = usePathname();

  return (
    <motion.aside
      initial={false}
      animate={{ width: isHovered ? 250 : 80 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="h-full flex flex-col bg-background border-r border-[hsl(var(--sidebar-border))]"
    >
      {/* HEADER */}
      <div className="flex items-center h-16 border-b px-4 border-[hsl(var(--sidebar-border))]">
        <Link href={"/"} className="flex items-center gap-2">
          <Logo size="md" showText={false} />

          <motion.span
            initial={false}
            animate={{
              opacity: isHovered ? 1 : 0,
              width: isHovered ? "auto" : 0,
            }}
            transition={{ duration: 0.2 }}
            className="whitespace-nowrap overflow-hidden text-xl font-bold tracking-tight"
          >
            <span className="gradient-text">Link</span>
            <span className="text-foreground">Lab</span>
          </motion.span>
        </Link>
      </div>

      {/* MAIN NAV (SCROLLABLE) */}
      <nav className="flex flex-col gap-2 flex-1 overflow-y-auto p-4">
        {/* Dashboard */}
        <Link
          href="/dashboard"
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg min-h-10 transition-colors text-muted-foreground hover:bg-gray-400/15",
            pathname === "/dashboard" &&
              "text-[hsl(var(--sidebar-primary))] bg-gray-400/15",
          )}
        >
          <LayoutDashboard className="w-5 h-5 shrink-0" />
          <motion.span
            initial={false}
            animate={{
              opacity: isHovered ? 1 : 0,
              width: isHovered ? "auto" : 0,
            }}
            transition={{ duration: 0.2 }}
            className="whitespace-nowrap overflow-hidden text-sm"
          >
            Dashboard
          </motion.span>
        </Link>

        {/* Tools Label */}
        {isHovered && (
          <div className="pt-4 px-3 text-xs uppercase text-muted-foreground">
            Tools
          </div>
        )}

        {/* Tools */}
        {dashBoardTools.map(({ name, href, icon: Icon }) => (
          <Link
            key={name}
            href={href}
            className={cn(
              "flex items-center text-sm gap-2 px-3 py-2 rounded-lg min-h-10 transition-colors text-muted-foreground hover:bg-gray-400/15",
              pathname === href && "text-[hsl(var(--primary))] bg-gray-400/15",
            )}
          >
            <Icon className="w-5 h-5 shrink-0" />
            <motion.span
              initial={false}
              animate={{
                opacity: isHovered ? 1 : 0,
                width: isHovered ? "auto" : 0,
              }}
              transition={{ duration: 0 }}
              className="whitespace-nowrap overflow-hidden"
            >
              {name}
            </motion.span>
          </Link>
        ))}
      </nav>

      {/* BOTTOM SETTINGS */}
      <div className="p-4">
        <Link
          href="/dashboard/settings"
          className={cn(
            "flex items-center gap-2 px-3 py-2 rounded-lg min-h-10 transition-colors",
          )}
        >
          <Settings className="h-5 w-5 shrink-0" />

          <motion.span
            initial={false}
            animate={{
              opacity: isHovered ? 1 : 0,
              width: isHovered ? "auto" : 0,
            }}
            transition={{ duration: 0.2 }}
            className="whitespace-nowrap overflow-hidden"
          >
            Settings
          </motion.span>
        </Link>
      </div>
    </motion.aside>
  );
}
