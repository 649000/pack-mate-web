import { describe, expect, it } from "vitest";
import { renderToBuffer } from "@react-pdf/renderer";
import { TripPdfDocument } from "./trip-pdf";
import { buildTripPdfViewModel } from "@/lib/pdf";
import type { PdfMode } from "@/lib/pdf";
import type { TripBag, TripEntry } from "@/lib/types";

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

async function render(bags: TripBag[], entries: TripEntry[], mode: PdfMode): Promise<Buffer> {
  const model = buildTripPdfViewModel({ trip, bags, entries, mode, unit: "kg" });
  const output = await renderToBuffer(<TripPdfDocument model={model} />);
  return Buffer.from(output as unknown as Uint8Array);
}

describe("TripPdfDocument", () => {
  it("produces a valid PDF", async () => {
    const bytes = await render(
      [bag({ id: "Backpack" })],
      [entry({ id: "a", name: "Passport" })],
      "blank",
    );
    expect(bytes.subarray(0, 5).toString("latin1")).toBe("%PDF-");
    expect(bytes.length).toBeGreaterThan(1000);
  });

  it("renders an empty trip without failing", async () => {
    const bytes = await render([], [], "blank");
    expect(bytes.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  });

  it("differs between blank and match mode when an entry is packed", async () => {
    const bags = [bag({ id: "Backpack" })];
    const entries = [
      entry({ id: "a", name: "Passport", trip_bag_id: "Backpack", is_packed: true }),
    ];
    const blank = await render(bags, entries, "blank");
    const match = await render(bags, entries, "packed");
    expect(match.length).not.toBe(blank.length);
  });

  it("is identical between modes when nothing is packed", async () => {
    const bags = [bag({ id: "Backpack" })];
    const entries = [entry({ id: "a", name: "Passport", trip_bag_id: "Backpack" })];
    const blank = await render(bags, entries, "blank");
    const match = await render(bags, entries, "packed");
    expect(match.length).toBe(blank.length);
  });
});
