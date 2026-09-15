import { describe, expect, it } from "vitest";
import {
  formatWeight,
  fromGrams,
  isOverLimit,
  isWeightComplete,
  sumBagWeight,
  sumEntryWeight,
  toGrams,
  tripBaggageTotal,
  weightByCategory,
} from "./weight";
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

function bag(
  id: string,
  weightLimitGrams: number | null = null,
  parentBagId: string | null = null,
): TripBag {
  return {
    id,
    trip_id: "t1",
    name: id,
    source_bag_id: null,
    position: 0,
    weight_limit_grams: weightLimitGrams,
    parent_bag_id: parentBagId,
  };
}

describe("toGrams / fromGrams", () => {
  it("converts from each unit", () => {
    expect(toGrams(1, "g")).toBe(1);
    expect(toGrams(1, "kg")).toBe(1000);
    expect(toGrams(1, "lb")).toBeCloseTo(453.59237, 5);
    expect(toGrams(1, "oz")).toBeCloseTo(28.349523125, 6);
  });

  it("round-trips values", () => {
    expect(fromGrams(toGrams(2.5, "kg"), "kg")).toBeCloseTo(2.5, 10);
    expect(fromGrams(toGrams(16, "oz"), "oz")).toBeCloseTo(16, 10);
  });
});

describe("formatWeight", () => {
  it("formats each unit with a sensible precision", () => {
    expect(formatWeight(1200, "kg")).toBe("1.20 kg");
    expect(formatWeight(1200, "g")).toBe("1200 g");
    expect(formatWeight(453.59237, "lb")).toBe("1.00 lb");
    expect(formatWeight(28.349523125, "oz")).toBe("1.0 oz");
  });
});

describe("isWeightComplete", () => {
  it("is true when every entry has a weight", () => {
    expect(isWeightComplete([entry({ id: "a", weight_grams: 100 })])).toBe(true);
  });

  it("is false when any entry lacks a weight", () => {
    expect(isWeightComplete([entry({ id: "a", weight_grams: 100 }), entry({ id: "b" })])).toBe(
      false,
    );
  });
});

describe("sumEntryWeight", () => {
  it("multiplies unit weight by quantity", () => {
    expect(sumEntryWeight([entry({ id: "a", weight_grams: 50, qty: 3 })])).toEqual({
      grams: 150,
      complete: true,
    });
  });

  it("sums entries and flags incomplete when a weight is missing", () => {
    expect(
      sumEntryWeight([
        entry({ id: "a", weight_grams: 100 }),
        entry({ id: "b" }),
        entry({ id: "c", weight_grams: 20, qty: 2 }),
      ]),
    ).toEqual({ grams: 140, complete: false });
  });
});

describe("sumBagWeight", () => {
  it("counts only entries inside the bag", () => {
    const entries = [
      entry({ id: "a", trip_bag_id: "bag1", weight_grams: 100 }),
      entry({ id: "b", trip_bag_id: "bag2", weight_grams: 500 }),
      entry({ id: "c", is_with_me: true, weight_grams: 50 }),
      entry({ id: "d", weight_grams: 25 }),
    ];
    const bags = [bag("bag1"), bag("bag2")];
    expect(sumBagWeight(bag("bag1"), bags, entries)).toEqual({ grams: 100, complete: true });
  });

  it("includes the weight of nested bags", () => {
    const bags = [bag("outer"), bag("inner", null, "outer")];
    const entries = [
      entry({ id: "a", trip_bag_id: "outer", weight_grams: 100 }),
      entry({ id: "b", trip_bag_id: "inner", weight_grams: 40, qty: 2 }),
    ];
    expect(sumBagWeight(bag("outer"), bags, entries)).toEqual({ grams: 180, complete: true });
    expect(sumBagWeight(bag("inner"), bags, entries)).toEqual({ grams: 80, complete: true });
  });

  it("propagates incompleteness from a nested bag", () => {
    const bags = [bag("outer"), bag("inner", null, "outer")];
    const entries = [
      entry({ id: "a", trip_bag_id: "outer", weight_grams: 100 }),
      entry({ id: "b", trip_bag_id: "inner" }),
    ];
    expect(sumBagWeight(bag("outer"), bags, entries)).toEqual({ grams: 100, complete: false });
  });
});

describe("tripBaggageTotal", () => {
  it("sums bags and excludes With Me and unassigned entries", () => {
    const bags = [bag("bag1"), bag("bag2")];
    const entries = [
      entry({ id: "a", trip_bag_id: "bag1", weight_grams: 100 }),
      entry({ id: "b", trip_bag_id: "bag2", weight_grams: 500, qty: 2 }),
      entry({ id: "c", is_with_me: true, weight_grams: 999 }),
      entry({ id: "d", weight_grams: 999 }),
    ];
    expect(tripBaggageTotal(bags, entries)).toEqual({ grams: 1100, complete: true });
  });

  it("flags incomplete when a bag contains an unweighted entry", () => {
    const bags = [bag("bag1")];
    const entries = [
      entry({ id: "a", trip_bag_id: "bag1", weight_grams: 100 }),
      entry({ id: "b", trip_bag_id: "bag1" }),
    ];
    expect(tripBaggageTotal(bags, entries)).toEqual({ grams: 100, complete: false });
  });

  it("is zero and complete when there are no bags", () => {
    expect(tripBaggageTotal([], [])).toEqual({ grams: 0, complete: true });
  });

  it("counts each entry once with nested bags", () => {
    const bags = [bag("outer"), bag("inner", null, "outer")];
    const entries = [
      entry({ id: "a", trip_bag_id: "outer", weight_grams: 100 }),
      entry({ id: "b", trip_bag_id: "inner", weight_grams: 40 }),
    ];
    expect(tripBaggageTotal(bags, entries)).toEqual({ grams: 140, complete: true });
  });

  it("treats a bag with a missing parent as top level", () => {
    const bags = [bag("orphan", null, "gone")];
    const entries = [entry({ id: "a", trip_bag_id: "orphan", weight_grams: 70 })];
    expect(tripBaggageTotal(bags, entries)).toEqual({ grams: 70, complete: true });
  });
});

describe("isOverLimit", () => {
  it("is false when there is no limit", () => {
    expect(isOverLimit(5000, null)).toBe(false);
  });

  it("is false when at or under the limit", () => {
    expect(isOverLimit(2000, 2000)).toBe(false);
    expect(isOverLimit(1999, 2000)).toBe(false);
  });

  it("is true when over the limit", () => {
    expect(isOverLimit(2001, 2000)).toBe(true);
  });
});

describe("weightByCategory", () => {
  it("sums unit weight times quantity per category", () => {
    const result = weightByCategory([
      entry({ id: "a", category: "clothing", weight_grams: 100, qty: 3 }),
      entry({ id: "b", category: "clothing", weight_grams: 50 }),
      entry({ id: "c", category: "electronics", weight_grams: 200 }),
    ]);

    expect(result).toEqual([
      { category: "clothing", grams: 350, complete: true },
      { category: "electronics", grams: 200, complete: true },
    ]);
  });

  it("includes With Me and unassigned entries", () => {
    const result = weightByCategory([
      entry({ id: "a", category: "documents", is_with_me: true, weight_grams: 30 }),
      entry({ id: "b", category: "documents", weight_grams: 20 }),
    ]);

    expect(result).toEqual([{ category: "documents", grams: 50, complete: true }]);
  });

  it("groups uncategorised entries last under null", () => {
    const result = weightByCategory([
      entry({ id: "a", weight_grams: 10 }),
      entry({ id: "b", category: "gear", weight_grams: 20 }),
    ]);

    expect(result).toEqual([
      { category: "gear", grams: 20, complete: true },
      { category: null, grams: 10, complete: true },
    ]);
  });

  it("marks a category incomplete when one of its entries has no weight", () => {
    const result = weightByCategory([
      entry({ id: "a", category: "clothing", weight_grams: 100 }),
      entry({ id: "b", category: "clothing" }),
    ]);

    expect(result).toEqual([{ category: "clothing", grams: 100, complete: false }]);
  });

  it("returns an empty breakdown for no entries", () => {
    expect(weightByCategory([])).toEqual([]);
  });
});
