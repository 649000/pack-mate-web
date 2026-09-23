import { describe, expect, it } from "vitest";
import { buildTripPdfViewModel, pdfFilename, type PdfViewModel } from "./pdf";
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

function bag(partial: Partial<TripBag> & { id: string }): TripBag {
  return {
    trip_id: "t1",
    name: partial.id,
    source_bag_id: null,
    position: 0,
    weight_limit_grams: null,
    parent_bag_id: null,
    icon: null,
    ...partial,
  };
}

const trip = {
  name: "Iceland 2026",
  destination: "Reykjavik",
  country_code: "IS",
  start_date: "2026-06-03",
  end_date: "2026-06-12",
};

function build(overrides: {
  bags?: TripBag[];
  entries?: TripEntry[];
  mode?: "blank" | "packed";
  unit?: "kg" | "lb";
  trip?: {
    name: string;
    destination: string | null;
    country_code: string;
    start_date: string | null;
    end_date: string | null;
  };
}): PdfViewModel {
  return buildTripPdfViewModel({
    trip: overrides.trip ?? trip,
    bags: overrides.bags ?? [],
    entries: overrides.entries ?? [],
    mode: overrides.mode ?? "blank",
    unit: overrides.unit ?? "kg",
  });
}

describe("buildTripPdfViewModel grouping and nesting", () => {
  const bags = [
    bag({ id: "Suitcase" }),
    bag({ id: "Toiletry", parent_bag_id: "Suitcase" }),
    bag({ id: "Daypack" }),
  ];
  const entries = [
    entry({ id: "a", name: "Passport", trip_bag_id: "Toiletry", qty: 2, category: "documents" }),
    entry({ id: "b", name: "Phone", is_with_me: true }),
    entry({ id: "c", name: "Adapter" }),
  ];

  it("orders bag groups depth-first and records nesting depth", () => {
    const model = build({ bags, entries });
    expect(model.bags.map((group) => [group.name, group.depth])).toEqual([
      ["Suitcase", 0],
      ["Toiletry", 1],
      ["Daypack", 0],
    ]);
  });

  it("places entries under their bag, With Me and unassigned", () => {
    const model = build({ bags, entries });
    const toiletry = model.bags.find((group) => group.name === "Toiletry");
    expect(toiletry?.entries.map((e) => e.name)).toEqual(["Passport"]);
    expect(model.withMe.map((e) => e.name)).toEqual(["Phone"]);
    expect(model.loose.map((e) => e.name)).toEqual(["Adapter"]);
  });

  it("carries quantity, category and weight", () => {
    const model = build({
      bags,
      entries: [
        entry({
          id: "a",
          name: "Passport",
          trip_bag_id: "Toiletry",
          qty: 2,
          category: "documents",
          weight_grams: 100,
        }),
      ],
    });
    const row = model.bags.find((group) => group.name === "Toiletry")?.entries[0];
    expect(row).toMatchObject({
      name: "Passport",
      qty: 2,
      category: "documents",
      weightLabel: "0.20 kg",
    });
  });

  it("shows a bag with no entries as empty", () => {
    const model = build({ bags: [bag({ id: "Empty" })], entries: [] });
    expect(model.bags[0].entries).toEqual([]);
  });

  it("counts packed against total", () => {
    const model = build({
      entries: [entry({ id: "a", is_packed: true }), entry({ id: "b" })],
    });
    expect({ packed: model.packed, total: model.total }).toEqual({ packed: 1, total: 2 });
  });

  it("formats trip dates", () => {
    expect(build({}).dates).toBe("2026-06-03 to 2026-06-12");
    expect(
      build({
        trip: {
          name: "X",
          destination: null,
          country_code: "IS",
          start_date: "2026-06-03",
          end_date: null,
        },
      }).dates,
    ).toBe("2026-06-03");
    expect(
      build({
        trip: {
          name: "X",
          destination: null,
          country_code: "IS",
          start_date: null,
          end_date: null,
        },
      }).dates,
    ).toBeNull();
  });

  it("formats the trip location from its destination and country", () => {
    expect(build({}).location).toBe("Reykjavik, Iceland");
    expect(
      build({
        trip: {
          name: "X",
          destination: null,
          country_code: "IS",
          start_date: null,
          end_date: null,
        },
      }).location,
    ).toBe("Iceland");
  });
});

describe("buildTripPdfViewModel modes", () => {
  const entries = [entry({ id: "a", is_packed: true }), entry({ id: "b", is_packed: false })];

  it("leaves every box empty in blank mode", () => {
    const model = build({ entries, mode: "blank" });
    expect(model.loose.map((e) => e.ticked)).toEqual([false, false]);
  });

  it("ticks exactly the packed entries in match mode", () => {
    const model = build({ entries, mode: "packed" });
    expect(model.loose.map((e) => e.ticked)).toEqual([true, false]);
  });

  it("applies the mode to With Me and bag entries too", () => {
    const model = build({
      bags: [bag({ id: "B" })],
      entries: [
        entry({ id: "a", trip_bag_id: "B", is_packed: true }),
        entry({ id: "b", is_with_me: true, is_packed: true }),
      ],
      mode: "packed",
    });
    expect(model.bags[0].entries[0].ticked).toBe(true);
    expect(model.withMe[0].ticked).toBe(true);
  });
});

describe("buildTripPdfViewModel weights", () => {
  it("shows weight against a limit when under", () => {
    const bags = [bag({ id: "B", weight_limit_grams: 5000 })];
    const entries = [entry({ id: "a", trip_bag_id: "B", weight_grams: 1000 })];
    const group = build({ bags, entries }).bags[0];
    expect(group).toMatchObject({
      weightLabel: "1.00 kg",
      limitLabel: "5.00 kg",
      overLimit: false,
    });
  });

  it("does not flag a bag exactly at its limit", () => {
    const bags = [bag({ id: "B", weight_limit_grams: 1000 })];
    const entries = [entry({ id: "a", trip_bag_id: "B", weight_grams: 1000 })];
    expect(build({ bags, entries }).bags[0].overLimit).toBe(false);
  });

  it("flags a bag over its limit", () => {
    const bags = [bag({ id: "B", weight_limit_grams: 1000 })];
    const entries = [entry({ id: "a", trip_bag_id: "B", weight_grams: 1500 })];
    expect(build({ bags, entries }).bags[0].overLimit).toBe(true);
  });

  it("shows weight without a limit when none is set", () => {
    const bags = [bag({ id: "B" })];
    const entries = [entry({ id: "a", trip_bag_id: "B", weight_grams: 1000 })];
    const group = build({ bags, entries }).bags[0];
    expect(group.limitLabel).toBeNull();
    expect(group.overLimit).toBe(false);
  });

  it("marks weight incomplete when an entry has no weight", () => {
    const bags = [bag({ id: "B" })];
    const entries = [
      entry({ id: "a", trip_bag_id: "B", weight_grams: 1000 }),
      entry({ id: "b", trip_bag_id: "B" }),
    ];
    expect(build({ bags, entries }).bags[0].weightComplete).toBe(false);
  });

  it("respects the display unit", () => {
    const entries = [entry({ id: "a", weight_grams: 1000 })];
    expect(build({ entries, unit: "lb" }).loose[0].weightLabel).toBe("2.20 lb");
  });
});

describe("buildTripPdfViewModel empty trip", () => {
  it("produces an empty state rather than failing", () => {
    const model = build({ bags: [], entries: [] });
    expect(model.isEmpty).toBe(true);
    expect(model.bags).toEqual([]);
    expect(model.withMe).toEqual([]);
    expect(model.loose).toEqual([]);
    expect(model.total).toBe(0);
  });
});

describe("buildTripPdfViewModel omits private detail", () => {
  it("does not carry descriptions, links or image URLs", () => {
    const entries = [
      entry({
        id: "a",
        description: "Navy cover",
        link: "https://example.com",
        image_url: "https://example.com/a.png",
      }),
    ];
    const row = build({ entries }).loose[0];
    expect(Object.keys(row).sort()).toEqual([
      "category",
      "id",
      "name",
      "qty",
      "ticked",
      "weightLabel",
    ]);
  });
});

describe("pdfFilename", () => {
  it("slugifies spaces and lowercases", () => {
    expect(pdfFilename("Iceland 2026")).toBe("pack-mate-iceland-2026.pdf");
  });

  it("removes unsafe characters such as slashes", () => {
    expect(pdfFilename("Summer / Winter")).toBe("pack-mate-summer-winter.pdf");
  });

  it("trims surrounding separators", () => {
    expect(pdfFilename("  Trip!  ")).toBe("pack-mate-trip.pdf");
  });

  it("bounds the length of long names", () => {
    const name = pdfFilename("a".repeat(200));
    expect(name.endsWith(".pdf")).toBe(true);
    expect(name.length).toBeLessThanOrEqual(95);
  });

  it("falls back when the name has no usable characters", () => {
    expect(pdfFilename("!!!")).toBe("pack-mate-packing-list.pdf");
  });
});
