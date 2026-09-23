import { describe, expect, it } from "vitest";
import {
  UNASSIGNED_LABEL,
  WITH_ME_LABEL,
  bagDescendantIds,
  buildBagTree,
  categoriesInUse,
  destinationBagId,
  destinationToLocation,
  entryLocationPath,
  filterByName,
  filterEntriesByCategory,
  filterEntriesByPacked,
  groupEntries,
  hasUncategorised,
  locationValue,
  packedSnapshot,
  packedUndoPatches,
  packingProgress,
  searchEntries,
} from "./packing";
import type { TripBag, TripEntry } from "./types";

function entry(partial: Partial<TripEntry> & { id: string }): TripEntry {
  return {
    trip_id: "t1",
    trip_bag_id: null,
    name: "Item",
    qty: 1,
    source_item_id: null,
    is_with_me: false,
    is_packed: false,
    position: 0,
    description: null,
    link: null,
    image_url: null,
    weight_grams: null,
    category: null,
    ...partial,
  };
}

function bag(id: string, parentBagId: string | null = null): TripBag {
  return {
    id,
    trip_id: "t1",
    name: id,
    source_bag_id: null,
    position: 0,
    weight_limit_grams: null,
    parent_bag_id: parentBagId,
    icon: null,
  };
}

describe("packingProgress", () => {
  it("counts packed against total", () => {
    const entries = [
      entry({ id: "a", is_packed: true }),
      entry({ id: "b" }),
      entry({ id: "c", is_packed: true }),
    ];
    expect(packingProgress(entries)).toEqual({ packed: 2, total: 3 });
  });

  it("returns zero of zero for an empty list", () => {
    expect(packingProgress([])).toEqual({ packed: 0, total: 0 });
  });
});

describe("groupEntries", () => {
  const bags = [bag("bag1"), bag("bag2")];

  it("groups by bag, with me, and loose", () => {
    const entries = [
      entry({ id: "a", trip_bag_id: "bag1" }),
      entry({ id: "b", trip_bag_id: "bag2" }),
      entry({ id: "c", is_with_me: true }),
      entry({ id: "d" }),
    ];
    const { byBag, withMe, loose } = groupEntries(entries, bags);
    expect(byBag.get("bag1")?.map((e) => e.id)).toEqual(["a"]);
    expect(byBag.get("bag2")?.map((e) => e.id)).toEqual(["b"]);
    expect(withMe.map((e) => e.id)).toEqual(["c"]);
    expect(loose.map((e) => e.id)).toEqual(["d"]);
  });

  it("places every entry in exactly one group", () => {
    const entries = [
      entry({ id: "a", trip_bag_id: "bag1" }),
      entry({ id: "b", is_with_me: true }),
      entry({ id: "c" }),
    ];
    const { byBag, withMe, loose } = groupEntries(entries, bags);
    const total =
      (byBag.get("bag1")?.length ?? 0) +
      (byBag.get("bag2")?.length ?? 0) +
      withMe.length +
      loose.length;
    expect(total).toBe(entries.length);
  });

  it("returns an empty group for a bag with no entries", () => {
    const { byBag } = groupEntries([], bags);
    expect(byBag.get("bag1")).toEqual([]);
  });
});

describe("location encoding", () => {
  it("maps an entry to its destination value", () => {
    expect(locationValue(entry({ id: "a" }))).toBe("loose");
    expect(locationValue(entry({ id: "b", is_with_me: true }))).toBe("with_me");
    expect(locationValue(entry({ id: "c", trip_bag_id: "bag9" }))).toBe("bag:bag9");
  });

  it("extracts a bag id only from bag destinations", () => {
    expect(destinationBagId("bag:abc")).toBe("abc");
    expect(destinationBagId("loose")).toBeNull();
    expect(destinationBagId("with_me")).toBeNull();
  });

  it("converts a destination back to a location", () => {
    expect(destinationToLocation("loose")).toEqual({ kind: "loose" });
    expect(destinationToLocation("with_me")).toEqual({ kind: "with_me" });
    expect(destinationToLocation("bag:xyz")).toEqual({ kind: "bag", bagId: "xyz" });
  });

  it("round-trips entry -> value -> location", () => {
    const withBag = entry({ id: "a", trip_bag_id: "bag7" });
    expect(destinationToLocation(locationValue(withBag))).toEqual({ kind: "bag", bagId: "bag7" });

    const withMe = entry({ id: "b", is_with_me: true });
    expect(destinationToLocation(locationValue(withMe))).toEqual({ kind: "with_me" });

    const loose = entry({ id: "c" });
    expect(destinationToLocation(locationValue(loose))).toEqual({ kind: "loose" });
  });
});

describe("entryLocationPath", () => {
  const bags = [bag("Suitcase"), bag("Toiletry", "Suitcase")];

  it("returns the bag name for an entry at the top level of a bag", () => {
    expect(entryLocationPath(entry({ id: "a", trip_bag_id: "Suitcase" }), bags)).toBe("Suitcase");
  });

  it("returns the full chain for an entry inside nested bags", () => {
    expect(entryLocationPath(entry({ id: "b", trip_bag_id: "Toiletry" }), bags)).toBe(
      "Suitcase > Toiletry",
    );
  });

  it("returns With Me for a With Me entry", () => {
    expect(entryLocationPath(entry({ id: "c", is_with_me: true }), bags)).toBe(WITH_ME_LABEL);
  });

  it("returns the unassigned label for a loose entry", () => {
    expect(entryLocationPath(entry({ id: "d" }), bags)).toBe(UNASSIGNED_LABEL);
  });

  it("returns the unassigned label when the bag is missing", () => {
    expect(entryLocationPath(entry({ id: "e", trip_bag_id: "gone" }), bags)).toBe(UNASSIGNED_LABEL);
  });
});

describe("buildBagTree", () => {
  it("nests children under their parent and keeps top-level bags at the root", () => {
    const tree = buildBagTree([bag("Suitcase"), bag("Toiletry", "Suitcase"), bag("Daypack")]);
    expect(tree.map((node) => node.bag.id)).toEqual(["Suitcase", "Daypack"]);
    const suitcase = tree.find((node) => node.bag.id === "Suitcase");
    expect(suitcase?.children.map((node) => node.bag.id)).toEqual(["Toiletry"]);
  });

  it("treats a bag with a missing parent as top level", () => {
    const tree = buildBagTree([bag("Orphan", "gone")]);
    expect(tree.map((node) => node.bag.id)).toEqual(["Orphan"]);
  });

  it("does not nest a bag under itself", () => {
    const tree = buildBagTree([bag("Self", "Self")]);
    expect(tree.map((node) => node.bag.id)).toEqual(["Self"]);
    expect(tree[0].children).toEqual([]);
  });
});

describe("bagDescendantIds", () => {
  it("collects the whole subtree", () => {
    const bags = [
      bag("Suitcase"),
      bag("Toiletry", "Suitcase"),
      bag("Pouch", "Toiletry"),
      bag("Daypack"),
    ];
    expect([...bagDescendantIds("Suitcase", bags)].sort()).toEqual(["Pouch", "Toiletry"]);
    expect([...bagDescendantIds("Pouch", bags)]).toEqual([]);
  });
});

describe("searchEntries", () => {
  const entries = [
    entry({ id: "a", name: "Passport" }),
    entry({ id: "b", name: "Travel adapter" }),
    entry({ id: "c", name: "PASSPORT holder" }),
  ];

  it("matches names case-insensitively", () => {
    expect(searchEntries(entries, "passport").map((e) => e.id)).toEqual(["a", "c"]);
  });

  it("matches partial names", () => {
    expect(searchEntries(entries, "adapt").map((e) => e.id)).toEqual(["b"]);
  });

  it("returns all entries for an empty or whitespace query", () => {
    expect(searchEntries(entries, "")).toEqual(entries);
    expect(searchEntries(entries, "   ")).toEqual(entries);
  });

  it("returns nothing when there is no match", () => {
    expect(searchEntries(entries, "tent")).toEqual([]);
  });
});

describe("filterByName", () => {
  const entries = [{ name: "Passport" }, { name: "Passport holder" }, { name: "Charger" }];

  it("matches case-insensitive substrings", () => {
    expect(filterByName(entries, "PASS").map((e) => e.name)).toEqual([
      "Passport",
      "Passport holder",
    ]);
  });

  it("ignores surrounding whitespace", () => {
    expect(filterByName(entries, "  charger  ").map((e) => e.name)).toEqual(["Charger"]);
  });

  it("returns everything for an empty query", () => {
    expect(filterByName(entries, "")).toEqual(entries);
    expect(filterByName(entries, "   ")).toEqual(entries);
  });

  it("returns nothing when there is no match", () => {
    expect(filterByName(entries, "tent")).toEqual([]);
  });

  it("works for any object with a name", () => {
    const items = [{ name: "Tent", id: 1 }];
    expect(filterByName(items, "ten")).toEqual(items);
  });
});

describe("filterEntriesByCategory", () => {
  const entries = [
    entry({ id: "a", name: "Tee", category: "clothing" }),
    entry({ id: "b", name: "Charger", category: "electronics" }),
    entry({ id: "c", name: "Toothbrush", category: "clothing" }),
    entry({ id: "d", name: "Adapter" }),
  ];

  it("returns everything for the all filter", () => {
    expect(filterEntriesByCategory(entries, "all")).toEqual(entries);
  });

  it("returns only the selected category", () => {
    expect(filterEntriesByCategory(entries, "clothing").map((e) => e.id)).toEqual(["a", "c"]);
  });

  it("returns uncategorised entries for the uncategorised filter", () => {
    expect(filterEntriesByCategory(entries, "uncategorised").map((e) => e.id)).toEqual(["d"]);
  });

  it("returns nothing when no entry matches", () => {
    expect(filterEntriesByCategory(entries, "pets")).toEqual([]);
  });
});

describe("filterEntriesByPacked", () => {
  const entries = [
    entry({ id: "a", is_packed: true }),
    entry({ id: "b" }),
    entry({ id: "c", is_packed: true }),
    entry({ id: "d" }),
  ];

  it("returns everything for the all filter", () => {
    expect(filterEntriesByPacked(entries, "all")).toEqual(entries);
  });

  it("returns only packed entries", () => {
    expect(filterEntriesByPacked(entries, "packed").map((e) => e.id)).toEqual(["a", "c"]);
  });

  it("returns only unpacked entries", () => {
    expect(filterEntriesByPacked(entries, "unpacked").map((e) => e.id)).toEqual(["b", "d"]);
  });
});

describe("categoriesInUse", () => {
  it("lists only the categories present, in canonical order", () => {
    const entries = [
      entry({ id: "a", category: "clothing" }),
      entry({ id: "b", category: "documents" }),
      entry({ id: "c", category: "clothing" }),
      entry({ id: "d" }),
    ];
    expect(categoriesInUse(entries)).toEqual(["documents", "clothing"]);
  });

  it("is empty when nothing is categorised", () => {
    expect(categoriesInUse([entry({ id: "a" })])).toEqual([]);
  });
});

describe("hasUncategorised", () => {
  it("detects uncategorised entries", () => {
    expect(hasUncategorised([entry({ id: "a", category: "gear" })])).toBe(false);
    expect(hasUncategorised([entry({ id: "a", category: "gear" }), entry({ id: "b" })])).toBe(true);
  });
});

describe("packedSnapshot / packedUndoPatches", () => {
  const entries = [
    { id: "a", is_packed: true },
    { id: "b", is_packed: false },
    { id: "c", is_packed: true },
  ];

  it("snapshots each entry's packed state", () => {
    expect(packedSnapshot(entries)).toEqual([
      { id: "a", is_packed: true },
      { id: "b", is_packed: false },
      { id: "c", is_packed: true },
    ]);
  });

  it("reverts only the entries a pack-all changed", () => {
    expect(packedUndoPatches(packedSnapshot(entries), true)).toEqual([
      { id: "b", is_packed: false },
    ]);
  });

  it("reverts only the entries an unpack-all changed", () => {
    expect(packedUndoPatches(packedSnapshot(entries), false)).toEqual([
      { id: "a", is_packed: true },
      { id: "c", is_packed: true },
    ]);
  });
});
