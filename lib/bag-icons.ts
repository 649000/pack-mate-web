import {
  Baby,
  Backpack,
  Briefcase,
  Camera,
  Droplets,
  Dumbbell,
  FileText,
  Footprints,
  Gem,
  Handbag,
  Luggage,
  Package,
  PawPrint,
  Shirt,
  ShoppingBag,
  Smartphone,
  Stethoscope,
  UtensilsCrossed,
  WashingMachine,
  Waves,
  type LucideIcon,
} from "lucide-react";
import type { ItemCategory } from "./types";

// Fixed set of bag icon keys a user can choose from. Stored as semantic slugs
// (not icon-library names) so the icon set can change without a data migration.
// The database check constraints mirror this list; lib/bag-icons.test.ts asserts
// the two stay in sync.
export const BAG_ICON_KEYS = [
  "backpack",
  "suitcase",
  "duffel",
  "daypack",
  "tote",
  "briefcase",
  "camera",
  "electronics",
  "toiletry",
  "medical",
  "clothing",
  "footwear",
  "documents",
  "valuables",
  "sports",
  "beach",
  "food",
  "baby",
  "pet",
  "laundry",
  "other",
] as const;

export type BagIcon = (typeof BAG_ICON_KEYS)[number];

export const BAG_ICONS = {
  backpack: Backpack,
  suitcase: Luggage,
  duffel: ShoppingBag,
  daypack: Backpack,
  tote: Handbag,
  briefcase: Briefcase,
  camera: Camera,
  electronics: Smartphone,
  toiletry: Droplets,
  medical: Stethoscope,
  clothing: Shirt,
  footwear: Footprints,
  documents: FileText,
  valuables: Gem,
  sports: Dumbbell,
  beach: Waves,
  food: UtensilsCrossed,
  baby: Baby,
  pet: PawPrint,
  laundry: WashingMachine,
  other: Package,
} satisfies Record<BagIcon, LucideIcon>;

export const BAG_ICON_LABELS = {
  backpack: "Backpack",
  suitcase: "Suitcase",
  duffel: "Duffel",
  daypack: "Daypack",
  tote: "Tote",
  briefcase: "Briefcase",
  camera: "Camera",
  electronics: "Electronics",
  toiletry: "Toiletry",
  medical: "Medical",
  clothing: "Clothing",
  footwear: "Footwear",
  documents: "Documents",
  valuables: "Valuables",
  sports: "Sports",
  beach: "Beach",
  food: "Food",
  baby: "Baby",
  pet: "Pet",
  laundry: "Laundry",
  other: "Other",
} satisfies Record<BagIcon, string>;

export function isBagIcon(value: unknown): value is BagIcon {
  return typeof value === "string" && (BAG_ICON_KEYS as readonly string[]).includes(value);
}

export function bagIconLabel(icon: string | null | undefined): string {
  return isBagIcon(icon) ? BAG_ICON_LABELS[icon] : "Bag";
}

// Maps the categories of a bag's contents to a bag icon, so a bag without a
// chosen icon still gets a meaningful one. Higher-priority categories win ties.
const CATEGORY_BAG_ICON: Partial<Record<ItemCategory, BagIcon>> = {
  toiletries: "toiletry",
  health: "medical",
  electronics: "electronics",
  work_study: "electronics",
  entertainment: "electronics",
  clothing: "clothing",
  formal: "clothing",
  comfort: "clothing",
  footwear: "footwear",
  documents: "documents",
  valuables: "valuables",
  sports: "sports",
  gear: "sports",
  swim_beach: "beach",
  food: "food",
  baby_kids: "baby",
  pets: "pet",
  laundry: "laundry",
};

// The icon key to use: the user's choice when set, otherwise derived from the
// bag's contents, otherwise the generic "other".
export function resolveBagIconKey(
  icon: string | null | undefined,
  categories: readonly (ItemCategory | null)[],
): BagIcon {
  if (isBagIcon(icon)) return icon;

  const counts = new Map<BagIcon, number>();
  for (const category of categories) {
    if (category === null) continue;
    const key = CATEGORY_BAG_ICON[category];
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  let best: BagIcon = "other";
  let bestCount = 0;
  // Iterate BAG_ICON_KEYS so ties resolve deterministically by key order.
  for (const key of BAG_ICON_KEYS) {
    const count = counts.get(key) ?? 0;
    if (count > bestCount) {
      best = key;
      bestCount = count;
    }
  }
  return best;
}
