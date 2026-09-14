import type { TripBag, TripEntry } from "./types";

export function packingProgress(entries: TripEntry[]): { packed: number; total: number } {
  return {
    packed: entries.filter((entry) => entry.is_packed).length,
    total: entries.length,
  };
}

export type Destination = string; // "loose" | "with_me" | "bag:<id>"

export function locationValue(entry: TripEntry): Destination {
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

export function groupEntries(
  entries: TripEntry[],
  bags: TripBag[],
): { byBag: Map<string, TripEntry[]>; withMe: TripEntry[]; loose: TripEntry[] } {
  const byBag = new Map<string, TripEntry[]>();
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
