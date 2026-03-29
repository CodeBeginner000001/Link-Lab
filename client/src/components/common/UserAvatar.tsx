"use client";

import { useAuth } from "@/Provider/AuthUserProvider";
import { logout } from "@/service/auth";
import { useToastNotification } from "@/utils/toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu";
import { LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Avatar, AvatarImage } from "../ui/Avatar";
import { Button } from "../ui/Button";

const UserAvatar = () => {
  const user = useAuth();
  const router = useRouter();
  const notify = useToastNotification();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogOut = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);
    const logOutResult = await logout();
    setIsLoggingOut(false);

    if ("result" in logOutResult && logOutResult.result?.success) {
      notify(logOutResult.result.data.message, "success");
      router.replace("/login");
      router.refresh();
      return;
    }

    const message =
      "error" in logOutResult
        ? Array.isArray(logOutResult.error?.message)
          ? logOutResult.error.message[0]
          : logOutResult.error?.message
        : "Unable to logout";

    notify(message || "Unable to logout", "error");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
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
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 rounded-lg border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--background))]"
      >
        <div className="px-4 py-3">
          <p className="text-sm font-medium">{user?.name}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <a
            href="/dashboard/settings"
            className="flex items-center gap-2 cursor-pointer px-4 py-2 border-y border-[hsl(var(--sidebar-border))] focus-visible:outline-none hover:bg-[hsl(var(--secondary)/0.7)]"
          >
            <User className="h-4 w-4" />
            Profile Settings
          </a>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={handleLogOut}
          disabled={isLoggingOut}
          className="text-[hsl(var(--destructive))] flex items-center focus:text-[hsl(var(--destructive))] cursor-pointer px-4 py-2 focus-visible:outline-none hover:bg-[hsl(var(--secondary))] disabled:pointer-events-none disabled:opacity-60"
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
