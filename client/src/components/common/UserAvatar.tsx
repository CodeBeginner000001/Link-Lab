"use client"
import { Avatar, AvatarImage } from "@radix-ui/react-avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@radix-ui/react-dropdown-menu";
import { User, LogOut } from "lucide-react";
import { Button } from "../ui/Button";
import { AvatarFallback } from "../ui/Avatar";
import { useAuth } from "@/Provider/AuthUserProvider";

const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

const UserAvatar = () => {
    const user = useAuth()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.avatar || undefined} />
            <AvatarFallback className="bg-[hsl(var(--primary))] w-10 text-black text-lg">
                {getInitials(user?.name)}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-lg border border-[hsl(var(--sidebar-border))] bg-[hsl(var(--background))]">
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
        <DropdownMenuItem className="text-[hsl(var(--destructive))] flex items-center focus:text-[hsl(var(--destructive))] cursor-pointer px-4 py-2 focus-visible:outline-none hover:bg-[hsl(var(--secondary))]">
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserAvatar;

// add a refresh in current user
// remove from middleware 
// refresh only in access token is not present 

