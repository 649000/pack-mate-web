import {
  Backpack,
  LayoutDashboard,
  ListChecks,
  Luggage,
  Share2,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  title: string;
  path: string;
  icon: LucideIcon;
}

export const navGroups: { label: string; items: NavItem[] }[] = [
  {
    label: "Planning",
    items: [
      { title: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
      { title: "Trips", path: "/trips", icon: ListChecks },
    ],
  },
  {
    label: "Library",
    items: [
      { title: "Bag Library", path: "/bags", icon: Luggage },
      { title: "Items Library", path: "/items", icon: Backpack },
    ],
  },
  {
    label: "Sharing",
    items: [{ title: "Shared Links", path: "/shares", icon: Share2 }],
  },
];

export const primaryNav: NavItem[] = navGroups.flatMap((group) => group.items);

export const primaryTabs: NavItem[] = [
  { title: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { title: "Trips", path: "/trips", icon: ListChecks },
  { title: "Bags", path: "/bags", icon: Luggage },
  { title: "Items", path: "/items", icon: Backpack },
];
