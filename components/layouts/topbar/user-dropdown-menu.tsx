"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { LogOut, Moon, Sun, User } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { initials } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserDropdownMenu() {
  const { user, signOut } = useAuth();
  const { resolvedTheme, setTheme } = useTheme();
  const email = user?.email ?? "";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="cursor-pointer" aria-label="User menu">
        <Avatar className="size-9">
          <AvatarFallback>{initials(email)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" side="bottom" align="end" sideOffset={11}>
        <div className="flex items-center gap-3 px-3 py-2">
          <Avatar>
            <AvatarFallback>{initials(email)}</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col items-start">
            <span className="max-w-[9rem] truncate text-sm font-semibold text-foreground">
              {email || "Signed in"}
            </span>
            <span className="text-xs text-muted-foreground">Pack Mate account</span>
          </div>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild>
          <Link href="/account">
            <User />
            <span>Account</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
          {resolvedTheme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          <span>{resolvedTheme === "dark" ? "Light mode" : "Dark mode"}</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => void signOut()}>
          <LogOut />
          <span>Sign out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
