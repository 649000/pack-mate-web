import {
  Accessibility,
  Baby,
  Backpack,
  BedDouble,
  Church,
  Crown,
  Droplets,
  Dumbbell,
  FileText,
  Footprints,
  Gamepad2,
  Gem,
  HeartPulse,
  Laptop,
  Package,
  PawPrint,
  Shirt,
  Smartphone,
  UtensilsCrossed,
  WashingMachine,
  Waves,
  type LucideIcon,
} from "lucide-react";
import type { ItemCategory } from "./types";

// One icon per canonical category, so items are identifiable at a glance. The
// map is exhaustive over ItemCategory; lib/category-icons.test.ts asserts that.
export const CATEGORY_ICONS = {
  documents: FileText,
  valuables: Gem,
  health: HeartPulse,
  clothing: Shirt,
  footwear: Footprints,
  swim_beach: Waves,
  formal: Crown,
  toiletries: Droplets,
  comfort: BedDouble,
  electronics: Smartphone,
  work_study: Laptop,
  entertainment: Gamepad2,
  sports: Dumbbell,
  gear: Backpack,
  food: UtensilsCrossed,
  laundry: WashingMachine,
  baby_kids: Baby,
  pets: PawPrint,
  religious: Church,
  accessibility: Accessibility,
} satisfies Record<ItemCategory, LucideIcon>;

// Shown for items that have no category.
export const CATEGORY_ICON_FALLBACK = Package;

export function categoryIcon(category: ItemCategory | null | undefined): LucideIcon {
  if (!category) return CATEGORY_ICON_FALLBACK;
  return CATEGORY_ICONS[category] ?? CATEGORY_ICON_FALLBACK;
}
