import { formatDestination } from "./countries";
import { buildBagTree, groupEntries, packingProgress, type BagNode } from "./packing";
import type { DisplayWeightUnit, ItemCategory, TripBag, TripEntry } from "./types";
import { formatWeight, isOverLimit, sumBagWeight } from "./weight";

export type PdfMode = "blank" | "packed";

export type PdfEntry = {
  id: string;
  name: string;
  qty: number;
  category: ItemCategory | null;
  ticked: boolean;
  weightLabel: string | null;
};

export type PdfBagGroup = {
  id: string;
  name: string;
  depth: number;
  entries: PdfEntry[];
  weightLabel: string;
  weightComplete: boolean;
  limitLabel: string | null;
  overLimit: boolean;
};

export type PdfViewModel = {
  tripName: string;
  location: string | null;
  dates: string | null;
  packed: number;
  total: number;
  bags: PdfBagGroup[];
  withMe: PdfEntry[];
  loose: PdfEntry[];
  isEmpty: boolean;
};

type PdfTrip = {
  name: string;
  destination: string | null;
  country_code: string;
  start_date: string | null;
  end_date: string | null;
};

export function formatTripDates(trip: PdfTrip): string | null {
  if (!trip.start_date && !trip.end_date) return null;
  if (trip.start_date && trip.end_date) return `${trip.start_date} to ${trip.end_date}`;
  return trip.start_date ?? trip.end_date ?? null;
}

function toPdfEntry(entry: TripEntry, mode: PdfMode, unit: DisplayWeightUnit): PdfEntry {
  return {
    id: entry.id,
    name: entry.name,
    qty: entry.qty,
    category: entry.category,
    ticked: mode === "packed" ? entry.is_packed : false,
    weightLabel:
      entry.weight_grams === null ? null : formatWeight(entry.weight_grams * entry.qty, unit),
  };
}

function flattenBagTree(
  nodes: BagNode<TripBag>[],
  depth = 0,
): Array<{ bag: TripBag; depth: number }> {
  const result: Array<{ bag: TripBag; depth: number }> = [];
  for (const node of nodes) {
    result.push({ bag: node.bag, depth });
    result.push(...flattenBagTree(node.children, depth + 1));
  }
  return result;
}

export function buildTripPdfViewModel({
  trip,
  bags,
  entries,
  mode,
  unit,
}: {
  trip: PdfTrip;
  bags: TripBag[];
  entries: TripEntry[];
  mode: PdfMode;
  unit: DisplayWeightUnit;
}): PdfViewModel {
  const { byBag, withMe, loose } = groupEntries(entries, bags);
  const progress = packingProgress(entries);

  const groups: PdfBagGroup[] = flattenBagTree(buildBagTree(bags)).map(({ bag, depth }) => {
    const weight = sumBagWeight(bag, bags, entries);
    return {
      id: bag.id,
      name: bag.name,
      depth,
      entries: (byBag.get(bag.id) ?? []).map((entry) => toPdfEntry(entry, mode, unit)),
      weightLabel: formatWeight(weight.grams, unit),
      weightComplete: weight.complete,
      limitLabel:
        bag.weight_limit_grams === null ? null : formatWeight(bag.weight_limit_grams, unit),
      overLimit: isOverLimit(weight.grams, bag.weight_limit_grams),
    };
  });

  return {
    tripName: trip.name,
    location: formatDestination(trip.destination, trip.country_code),
    dates: formatTripDates(trip),
    packed: progress.packed,
    total: progress.total,
    bags: groups,
    withMe: withMe.map((entry) => toPdfEntry(entry, mode, unit)),
    loose: loose.map((entry) => toPdfEntry(entry, mode, unit)),
    isEmpty: bags.length === 0 && entries.length === 0,
  };
}

const MAX_FILENAME_LENGTH = 80;

export function pdfFilename(tripName: string): string {
  const base = tripName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_FILENAME_LENGTH)
    .replace(/-+$/g, "");
  return `pack-mate-${base || "packing-list"}.pdf`;
}
