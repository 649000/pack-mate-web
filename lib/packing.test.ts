import { describe, expect, it } from "vitest";
import {
  destinationBagId,
  destinationToLocation,
  groupEntries,
  locationValue,
  packingProgress,
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
    ...partial,
  };
}

function bag(id: string): TripBag {
  return { id, trip_id: "t1", name: id, source_bag_id: null, position: 0 };
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
