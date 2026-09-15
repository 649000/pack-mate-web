import type { BagLike, EntryLike, ItemCategory } from "./types";
import { ITEM_CATEGORIES } from "./validation";

export type WeightUnit = "g" | "kg" | "oz" | "lb";

export const WEIGHT_UNITS = ["g", "kg", "oz", "lb"] as const satisfies readonly WeightUnit[];

function gramsPerUnit(unit: WeightUnit): number {
  switch (unit) {
    case "g":
      return 1;
    case "kg":
      return 1000;
    case "oz":
      return 28.349523125;
    case "lb":
      return 453.59237;
  }
}

function displayDecimals(unit: WeightUnit): number {
  switch (unit) {
    case "g":
      return 0;
    case "kg":
      return 2;
    case "oz":
      return 1;
    case "lb":
      return 2;
  }
}

export function toGrams(value: number, unit: WeightUnit): number {
  return value * gramsPerUnit(unit);
}

export function fromGrams(grams: number, unit: WeightUnit): number {
  return grams / gramsPerUnit(unit);
}

export function formatWeight(grams: number, unit: WeightUnit): string {
  return `${fromGrams(grams, unit).toFixed(displayDecimals(unit))} ${unit}`;
}

export type WeightTotal = { grams: number; complete: boolean };

export function isWeightComplete<E extends { weight_grams: number | null }>(entries: E[]): boolean {
  return entries.every((entry) => entry.weight_grams !== null);
}

export function sumEntryWeight<E extends { weight_grams: number | null; qty: number }>(
  entries: E[],
): WeightTotal {
  const grams = entries.reduce(
    (total, entry) =>
      entry.weight_grams === null ? total : total + entry.weight_grams * entry.qty,
    0,
  );
  return { grams, complete: isWeightComplete(entries) };
}

export function sumBagWeight<B extends BagLike, E extends EntryLike>(
  bag: B,
  bags: B[],
  entries: E[],
): WeightTotal {
  const own = sumEntryWeight(entries.filter((entry) => entry.trip_bag_id === bag.id));
  let grams = own.grams;
  let complete = own.complete;
  for (const child of bags) {
    if (child.parent_bag_id !== bag.id) continue;
    const childWeight = sumBagWeight(child, bags, entries);
    grams += childWeight.grams;
    if (!childWeight.complete) complete = false;
  }
  return { grams, complete };
}

export function tripBaggageTotal<B extends BagLike, E extends EntryLike>(
  bags: B[],
  entries: E[],
): WeightTotal {
  const bagIds = new Set(bags.map((bag) => bag.id));
  let grams = 0;
  let complete = true;
  for (const bag of bags) {
    const isRoot = !bag.parent_bag_id || !bagIds.has(bag.parent_bag_id);
    if (!isRoot) continue;
    const bagWeight = sumBagWeight(bag, bags, entries);
    grams += bagWeight.grams;
    if (!bagWeight.complete) complete = false;
  }
  return { grams, complete };
}

export function isOverLimit(grams: number, limitGrams: number | null): boolean {
  return limitGrams !== null && grams > limitGrams;
}

export type CategoryWeight = {
  category: ItemCategory | null;
  grams: number;
  complete: boolean;
};

// Weight grouped by category across the whole list, including With Me and
// unassigned entries. Uncategorised entries are grouped last under `null`.
export function weightByCategory<
  E extends { category: ItemCategory | null; weight_grams: number | null; qty: number },
>(entries: E[]): CategoryWeight[] {
  const totals = new Map<ItemCategory | null, WeightTotal>();
  for (const entry of entries) {
    const current = totals.get(entry.category) ?? { grams: 0, complete: true };
    if (entry.weight_grams === null) {
      current.complete = false;
    } else {
      current.grams += entry.weight_grams * entry.qty;
    }
    totals.set(entry.category, current);
  }

  const ordered: CategoryWeight[] = [];
  for (const category of ITEM_CATEGORIES) {
    const total = totals.get(category);
    if (total) ordered.push({ category, ...total });
  }
  const uncategorised = totals.get(null);
  if (uncategorised) ordered.push({ category: null, ...uncategorised });
  return ordered;
}
