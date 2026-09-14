"use client";

import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export function NotificationsSheet() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          mode="icon"
          shape="circle"
          className="size-9"
          aria-label="Notifications"
        >
          <Bell className="size-4.5!" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[320px]" side="right">
        <SheetHeader>
          <SheetTitle>Notifications</SheetTitle>
        </SheetHeader>
        <SheetBody className="flex items-center justify-center py-16 text-sm text-muted-foreground">
          No notifications yet.
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
