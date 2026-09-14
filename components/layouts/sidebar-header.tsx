"use client";

import Link from "next/link";
import { ChevronFirst } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useLayout } from "./layout-context";

export function SidebarHeader() {
  const { sidebarCollapse, setSidebarCollapse } = useLayout();

  return (
    <div className="sidebar-header hidden lg:flex items-center relative justify-between px-3 lg:px-6 shrink-0">
      <Link href="/trips">
        <span className="default-logo text-lg font-semibold tracking-tight">Pack Mate</span>
        <span className="small-logo text-lg font-semibold tracking-tight">PM</span>
      </Link>
      <Button
        onClick={() => setSidebarCollapse(!sidebarCollapse)}
        size="sm"
        mode="icon"
        variant="outline"
        aria-label="Toggle sidebar"
        className={cn(
          "size-7 absolute start-full top-2/4 -translate-x-2/4 -translate-y-2/4",
          sidebarCollapse ? "ltr:rotate-180" : "rtl:rotate-180",
        )}
      >
        <ChevronFirst className="size-4!" />
      </Button>
    </div>
  );
}
