"use client";

import { useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Backpack, ListChecks, Luggage, Share2, type LucideIcon } from "lucide-react";
import {
  AccordionMenu,
  AccordionMenuClassNames,
  AccordionMenuGroup,
  AccordionMenuItem,
  AccordionMenuLabel,
} from "@/components/ui/accordion-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

interface NavItem {
  title: string;
  path: string;
  icon: LucideIcon;
}

export const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "Packing",
    items: [
      { title: "Trips", path: "/trips", icon: ListChecks },
      { title: "Shared links", path: "/shares", icon: Share2 },
    ],
  },
  {
    label: "Library",
    items: [
      { title: "Bags", path: "/bags", icon: Luggage },
      { title: "Items", path: "/items", icon: Backpack },
    ],
  },
];

export function SidebarMenu({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  const matchPath = useCallback((path: string): boolean => path === pathname, [pathname]);

  const classNames: AccordionMenuClassNames = {
    root: "lg:ps-1 space-y-3",
    group: "gap-px",
    label: "uppercase text-xs font-medium text-muted-foreground/70 pt-2.25 pb-px",
    separator: "",
    item: "h-8 hover:bg-transparent text-accent-foreground hover:text-primary data-[selected=true]:text-primary data-[selected=true]:bg-muted data-[selected=true]:font-medium",
    sub: "",
    subTrigger:
      "h-8 hover:bg-transparent text-accent-foreground hover:text-primary data-[selected=true]:text-primary data-[selected=true]:bg-muted data-[selected=true]:font-medium",
    subContent: "py-0",
    indicator: "",
  };

  return (
    <ScrollArea className="flex grow shrink-0 py-5 px-5 lg:h-[calc(100vh-5.5rem)]">
      <AccordionMenu
        selectedValue={pathname}
        matchPath={matchPath}
        type="single"
        collapsible
        classNames={classNames}
        onItemClick={(value) => {
          if (value && value !== "#") {
            router.push(value);
            onNavigate?.();
          }
        }}
      >
        {navGroups.map((group) => (
          <div key={group.label} className="space-y-3">
            <AccordionMenuLabel>{group.label}</AccordionMenuLabel>
            <AccordionMenuGroup>
              {group.items.map((item) => (
                <AccordionMenuItem
                  key={item.path}
                  value={item.path}
                  className="text-sm font-medium"
                >
                  <item.icon data-slot="accordion-menu-icon" />
                  <span data-slot="accordion-menu-title">{item.title}</span>
                </AccordionMenuItem>
              ))}
            </AccordionMenuGroup>
          </div>
        ))}
      </AccordionMenu>
    </ScrollArea>
  );
}
