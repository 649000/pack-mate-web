"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetBody, SheetContent, SheetHeader, SheetTrigger } from "@/components/ui/sheet";
import { SidebarMenu } from "./sidebar-menu";
import { NotificationsSheet } from "./topbar/notifications-sheet";
import { SearchDialog } from "./topbar/search-dialog";
import { UserDropdownMenu } from "./topbar/user-dropdown-menu";

export function Header() {
  const [navOpen, setNavOpen] = useState(false);

  return (
    <header className="header fixed top-0 z-10 start-0 flex items-stretch shrink-0 border-b border-border bg-background end-0">
      <div className="container-fluid flex justify-between items-stretch lg:gap-4">
        <div className="flex lg:hidden items-center gap-2.5">
          <Link href="/trips" className="shrink-0 text-base font-semibold tracking-tight">
            Pack Mate
          </Link>
          <Sheet open={navOpen} onOpenChange={setNavOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" mode="icon" aria-label="Open navigation">
                <Menu className="text-muted-foreground/70" />
              </Button>
            </SheetTrigger>
            <SheetContent className="p-0 gap-0 w-[275px]" side="left" close={false}>
              <SheetHeader className="p-0 space-y-0" />
              <SheetBody className="p-0 overflow-y-auto">
                <SidebarMenu onNavigate={() => setNavOpen(false)} />
              </SheetBody>
            </SheetContent>
          </Sheet>
        </div>

        <div className="hidden lg:flex items-center gap-2.5" />

        <div className="flex items-center gap-1.5">
          <SearchDialog />
          <NotificationsSheet />
          <UserDropdownMenu />
        </div>
      </div>
    </header>
  );
}
