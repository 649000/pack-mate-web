import type { BagLike, EntryLike, ItemCategory, TripBag } from "./types";
import { ITEM_CATEGORIES } from "./validation";

export function packingProgress<E extends { is_packed: boolean }>(
  entries: E[],
): { packed: number; total: number } {
  return {
    packed: entries.filter((entry) => entry.is_packed).length,
    total: entries.length,
  };
}

export type Destination = string; // "loose" | "with_me" | "bag:<id>"

export function locationValue(entry: EntryLike): Destination {
  if (entry.is_with_me) return "with_me";
  if (entry.trip_bag_id) return `bag:${entry.trip_bag_id}`;
  return "loose";
}

export function destinationBagId(destination: Destination): string | null {
  return destination.startsWith("bag:") ? destination.slice(4) : null;
}

export function destinationToLocation(
  destination: Destination,
): { kind: "bag"; bagId: string } | { kind: "with_me" } | { kind: "loose" } {
  if (destination === "with_me") return { kind: "with_me" };
  if (destination === "loose") return { kind: "loose" };
  return { kind: "bag", bagId: destination.slice(4) };
}

export function groupEntries<E extends EntryLike, B extends BagLike>(
  entries: E[],
  bags: B[],
): { byBag: Map<string, E[]>; withMe: E[]; loose: E[] } {
  const byBag = new Map<string, E[]>();
  for (const bag of bags) {
    byBag.set(
      bag.id,
      entries.filter((entry) => entry.trip_bag_id === bag.id),
    );
  }
  return {
    byBag,
    withMe: entries.filter((entry) => entry.is_with_me),
    loose: entries.filter((entry) => !entry.is_with_me && !entry.trip_bag_id),
  };
}

export const WITH_ME_LABEL = "With Me";
export const UNASSIGNED_LABEL = "Not assigned";

export type BagNode<B extends BagLike = TripBag> = { bag: B; children: BagNode<B>[] };

function reachesBag(byId: Map<string, BagLike>, fromId: string, targetId: string): boolean {
  let current: string | null = fromId;
  const seen = new Set<string>();
  while (current) {
    if (current === targetId) return true;
    if (seen.has(current)) return false;
    seen.add(current);
    current = byId.get(current)?.parent_bag_id ?? null;
  }
  return false;
}

export function buildBagTree<B extends BagLike>(bags: B[]): BagNode<B>[] {
  const byId = new Map(bags.map((bag) => [bag.id, bag]));
  const nodes = new Map<string, BagNode<B>>();
  for (const bag of bags) {
    nodes.set(bag.id, { bag, children: [] });
  }
  const roots: BagNode<B>[] = [];
  for (const bag of bags) {
    const node = nodes.get(bag.id)!;
    const parentId = bag.parent_bag_id;
    const parent = parentId ? nodes.get(parentId) : undefined;
    if (parent && parent !== node && !reachesBag(byId, parentId!, bag.id)) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

export function bagDescendantIds<B extends BagLike>(bagId: string, bags: B[]): Set<string> {
  const children = new Map<string, string[]>();
  for (const bag of bags) {
    if (!bag.parent_bag_id) continue;
    const list = children.get(bag.parent_bag_id) ?? [];
    list.push(bag.id);
    children.set(bag.parent_bag_id, list);
  }
  const result = new Set<string>();
  const stack = [bagId];
  while (stack.length > 0) {
    const current = stack.pop()!;
    for (const child of children.get(current) ?? []) {
      if (!result.has(child)) {
        result.add(child);
        stack.push(child);
      }
    }
  }
  return result;
}

export function entryLocationPath<E extends EntryLike, B extends BagLike>(
  entry: E,
  bags: B[],
): string {
  if (entry.is_with_me) return WITH_ME_LABEL;
  if (!entry.trip_bag_id) return UNASSIGNED_LABEL;
  const byId = new Map(bags.map((bag) => [bag.id, bag]));
  const names: string[] = [];
  const seen = new Set<string>();
  let current: string | null = entry.trip_bag_id;
  while (current && !seen.has(current)) {
    seen.add(current);
    const bag = byId.get(current);
    if (!bag) break;
    names.unshift(bag.name);
    current = bag.parent_bag_id;
  }
  return names.length > 0 ? names.join(" > ") : UNASSIGNED_LABEL;
}

export function filterByName<T extends { name: string }>(entries: T[], query: string): T[] {
  const needle = query.trim().toLowerCase();
  if (needle.length === 0) return entries;
  return entries.filter((entry) => entry.name.toLowerCase().includes(needle));
}

export function searchEntries<E extends { name: string }>(entries: E[], query: string): E[] {
  return filterByName(entries, query);
}

export type CategoryFilter = "all" | "uncategorised" | ItemCategory;

export function filterEntriesByCategory<E extends { category: ItemCategory | null }>(
  entries: E[],
  filter: CategoryFilter,
): E[] {
  if (filter === "all") return entries;
  if (filter === "uncategorised") return entries.filter((entry) => entry.category === null);
  return entries.filter((entry) => entry.category === filter);
}

export type PackedFilter = "all" | "packed" | "unpacked";

export function filterEntriesByPacked<E extends { is_packed: boolean }>(
  entries: E[],
  filter: PackedFilter,
): E[] {
  if (filter === "all") return entries;
  if (filter === "packed") return entries.filter((entry) => entry.is_packed);
  return entries.filter((entry) => !entry.is_packed);
}

export function categoriesInUse<E extends { category: ItemCategory | null }>(
  entries: E[],
): ItemCategory[] {
  const present = new Set<ItemCategory>();
  for (const entry of entries) {
    if (entry.category !== null) present.add(entry.category);
  }
  return ITEM_CATEGORIES.filter((category) => present.has(category));
}

export function hasUncategorised<E extends { category: ItemCategory | null }>(
  entries: E[],
): boolean {
  return entries.some((entry) => entry.category === null);
}
