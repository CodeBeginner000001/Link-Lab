"use client";

import { Dispatch, SetStateAction } from "react";
import Logo from "../Logo";
import UserAvatar from "../common/UserAvatar";
import ToggleTheme from "../ui/ToggleTheme";

interface HeaderProps {
  setIsMobileSidebarOpen: Dispatch<SetStateAction<boolean>>;
}

export default function Header({ setIsMobileSidebarOpen }: HeaderProps) {
  return (
    <header className="fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-[hsl(var(--sidebar-border))] bg-background/80 px-4 backdrop-blur-sm sm:justify-end sm:px-6">
      <button
        type="button"
        onClick={() => setIsMobileSidebarOpen(true)}
        className="sm:hidden"
        aria-label="Open sidebar"
      >
        <Logo size="sm" showText={false} />
      </button>

      <div className="flex items-center gap-4">
        <ToggleTheme />
        <UserAvatar />
      </div>
    </header>
  );
}
