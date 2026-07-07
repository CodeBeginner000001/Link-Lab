"use client";

import { useAuth } from "@/Provider/AuthUserProvider";
import { useToastNotification } from "@/utils/toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu";
import { LogOut, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { Logout } from "@/service/auth";
import { getApiErrorMessage } from "@/utils/custom-error-message";

const USER_MENU_TRIGGER_ID = "dashboard-user-menu-trigger";
const USER_MENU_CONTENT_ID = "dashboard-user-menu-content";

function getUserInitials(name?: string | null, email?: string | null) {
  const source = name?.trim() || email?.trim() || "";

  if (!source) {
    return "?";
  }

  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

const UserAvatar = () => {
  const user = useAuth();
  const router = useRouter();
  const notify = useToastNotification();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleLogOut = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);
    const logOutResult = await Logout();
    setIsLoggingOut(false);

    if ("result" in logOutResult && logOutResult.result?.success) {
      notify(logOutResult.result.data.message, "success");
      router.replace("/login");
      router.refresh();
      return;
    }

    const message =
      "error" in logOutResult
        ? getApiErrorMessage(logOutResult.error, "Unable to logout")
        : "Unable to logout";

    notify(message, "error");
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger
        asChild
        id={USER_MENU_TRIGGER_ID}
        aria-controls={isOpen ? USER_MENU_CONTENT_ID : undefined}
      >
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full overflow-hidden p-0"
        >
          <Avatar className="h-full w-full">
            <AvatarImage
              src={user?.avatar || undefined}
              className="h-full w-full object-cover"
            />
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-[hsl(var(--primary))]">
              {getUserInitials(user?.name, user?.email)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        id={USER_MENU_CONTENT_ID}
        aria-labelledby={USER_MENU_TRIGGER_ID}
        align="end"
        className="w-56 rounded-lg border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--background))]"
      >
        <div className="px-4 py-3">
          <p className="text-sm font-medium">{user?.name}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>
        {/* <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link
            href="#"
            className="flex items-center gap-2 cursor-pointer px-4 py-2 border-y border-[hsl(var(--sidebar-border))] focus-visible:outline-none hover:bg-[hsl(var(--secondary)/0.7)]"
          >
            <User className="h-4 w-4" />
            Profile Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator /> */}
        <DropdownMenuItem
          onSelect={handleLogOut}
          disabled={isLoggingOut}
          className="text-[hsl(var(--destructive))] flex items-center focus:text-[hsl(var(--destructive))] border-t border-[hsl(var(--sidebar-border))] cursor-pointer px-4 py-2 focus-visible:outline-none hover:bg-[hsl(var(--secondary))] disabled:pointer-events-none disabled:opacity-60"
        >
          <LogOut className="h-4 w-4 mr-2" />
          {isLoggingOut ? "Signing Out..." : "Sign Out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserAvatar;

// add a refresh in current user
// remove from middleware
// refresh only in access token is not present
