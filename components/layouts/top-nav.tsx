"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { primaryNav } from "./nav-config";
import { SearchDialog } from "./topbar/search-dialog";
import { UserDropdownMenu } from "./topbar/user-dropdown-menu";

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 hidden border-b border-border bg-background/95 backdrop-blur lg:block">
      <div className="container-fluid flex h-14 items-center gap-4">
        <Link
          href="/dashboard"
          className="flex shrink-0 items-center gap-2 font-heading text-base font-bold tracking-tight"
        >
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
            PM
          </span>
          Pack Mate
        </Link>

        <nav className="flex items-center gap-0.5" aria-label="Primary">
          {primaryNav.map((item) => {
            const active = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                )}
              >
                <item.icon className="size-4" aria-hidden="true" />
                {item.title}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-1.5">
          <SearchDialog />
          <Button asChild size="sm">
            <Link href="/trips?new=1">
              <Plus aria-hidden="true" />
              New trip
            </Link>
          </Button>
          <UserDropdownMenu />
        </div>
      </div>
    </header>
  );
}
