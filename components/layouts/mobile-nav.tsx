"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { primaryTabs } from "./nav-config";
import { SearchDialog } from "./topbar/search-dialog";
import { UserDropdownMenu } from "./topbar/user-dropdown-menu";

export function MobileNav() {
  const pathname = usePathname();

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur lg:hidden">
        <div className="container-fluid flex h-14 items-center gap-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-heading text-base font-bold tracking-tight"
          >
            <span className="flex size-7 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
              PM
            </span>
            Pack Mate
          </Link>
          <div className="ml-auto flex items-center gap-1">
            <SearchDialog />
            <UserDropdownMenu />
          </div>
        </div>
      </header>

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background pb-[env(safe-area-inset-bottom)] lg:hidden"
      >
        <div className="grid grid-cols-4">
          {primaryTabs.map((item) => {
            const active = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[0.6875rem] font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <item.icon className="size-5" aria-hidden="true" />
                {item.title}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
