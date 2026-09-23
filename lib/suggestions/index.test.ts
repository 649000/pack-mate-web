import { describe, expect, it } from "vitest";
import { getTripSuggestions, combineSuggestions } from "./index";
import { ruleSuggestions, tripLengthDays } from "./rules";
import type { Suggestion, SuggestionContext, SuggestionProvider } from "./types";

function context(overrides: Partial<SuggestionContext> = {}): SuggestionContext {
  return {
    trip: {
      id: "t1",
      destination: "Barcelona",
      countryCode: "ES",
      startDate: "2026-10-12",
      endDate: "2026-10-19",
      ...overrides.trip,
    },
    facts: {
      country_code: "ES",
      currency_code: "EUR",
      calling_code: "+34",
      plug_types: ["C", "F"],
      voltage: "230",
      frequency: "50",
      timezones: ["Europe/Madrid"],
      updated_at: "2026-01-01T00:00:00Z",
      ...overrides.facts,
    },
    entries: overrides.entries ?? [],
    libraryItems: overrides.libraryItems ?? [],
  };
}

describe("ruleSuggestions", () => {
  it("suggests an adapter when the destination needs one and none is present", () => {
    const result = ruleSuggestions(context());
    const adapter = result.find((s) => s.key.startsWith("rules:adapter"));
    expect(adapter).toBeDefined();
    expect(adapter?.reason).toContain("Type C, Type F");
    expect(adapter?.action.kind).toBe("create-item");
  });

  it("does not suggest an adapter when one is already listed", () => {
    const result = ruleSuggestions(
      context({ entries: [{ name: "Universal adapter", category: "gear", isWithMe: false }] }),
    );
    expect(result.some((s) => s.key.startsWith("rules:adapter"))).toBe(false);
  });

  it("reuses a matching library item for the adapter", () => {
    const result = ruleSuggestions(
      context({ libraryItems: [{ id: "i1", name: "Travel adapter", category: "gear" }] }),
    );
    const adapter = result.find((s) => s.key.startsWith("rules:adapter"));
    expect(adapter?.action).toEqual({ kind: "library-item", itemId: "i1" });
  });

  it("suggests clothing on a multi-day trip with none", () => {
    expect(ruleSuggestions(context()).some((s) => s.key === "rules:clothing")).toBe(true);
  });

  it("does not suggest clothing when clothing is present or the trip is short", () => {
    expect(
      ruleSuggestions(
        context({ entries: [{ name: "T-shirts", category: "clothing", isWithMe: false }] }),
      ).some((s) => s.key === "rules:clothing"),
    ).toBe(false);
    expect(
      ruleSuggestions(
        context({
          trip: {
            id: "t2",
            destination: null,
            countryCode: "ES",
            startDate: "2026-10-12",
            endDate: "2026-10-12",
          },
        }),
      ).some((s) => s.key === "rules:clothing"),
    ).toBe(false);
  });

  it("suggests an essential when nothing is carried With Me", () => {
    expect(ruleSuggestions(context()).some((s) => s.key === "rules:essentials:passport")).toBe(
      true,
    );
  });

  it("does not suggest essentials when something is carried With Me", () => {
    const result = ruleSuggestions(
      context({ entries: [{ name: "Phone", category: "electronics", isWithMe: true }] }),
    );
    expect(result.some((s) => s.key.startsWith("rules:essentials"))).toBe(false);
  });

  it("returns nothing when the trip covers everything", () => {
    const result = ruleSuggestions(
      context({
        entries: [
          { name: "Plug adapter", category: "gear", isWithMe: false },
          { name: "Shirts", category: "clothing", isWithMe: false },
          { name: "Passport", category: "documents", isWithMe: true },
        ],
      }),
    );
    expect(result).toEqual([]);
  });
});

describe("tripLengthDays", () => {
  it("counts inclusive days", () => {
    expect(tripLengthDays(context())).toBe(8);
  });

  it("returns null without both dates", () => {
    expect(
      tripLengthDays(
        context({
          trip: { id: "t", destination: null, countryCode: "ES", startDate: null, endDate: null },
        }),
      ),
    ).toBeNull();
  });
});

describe("combineSuggestions", () => {
  it("drops duplicates by key and by name", () => {
    const base: Suggestion = {
      key: "a",
      name: "Clothing",
      reason: "",
      category: "clothing",
      action: { kind: "create-item", name: "Clothing", category: "clothing" },
      source: "rules",
      confidence: 1,
    };
    const result = combineSuggestions([
      base,
      { ...base },
      { ...base, key: "b", source: "ai", confidence: 0.5 },
    ]);
    expect(result).toHaveLength(1);
  });

  it("ranks by confidence", () => {
    const make = (key: string, confidence: number, name: string): Suggestion => ({
      key,
      name,
      reason: "",
      category: null,
      action: { kind: "create-item", name, category: null },
      source: "rules",
      confidence,
    });
    const result = combineSuggestions([make("a", 0.2, "A"), make("b", 0.9, "B")]);
    expect(result.map((s) => s.key)).toEqual(["b", "a"]);
  });
});

describe("getTripSuggestions", () => {
  it("includes the rules baseline even when extras are provided", async () => {
    const extra: SuggestionProvider = {
      id: "extra",
      async getSuggestions() {
        return [
          {
            key: "extra:sunscreen",
            name: "Sunscreen",
            reason: "",
            category: "toiletries",
            action: { kind: "create-item", name: "Sunscreen", category: "toiletries" },
            source: "ai",
            confidence: 0.4,
          },
        ];
      },
    };
    const result = await getTripSuggestions(context(), [extra]);
    expect(result.some((s) => s.key.startsWith("rules:adapter"))).toBe(true);
    expect(result.some((s) => s.key === "extra:sunscreen")).toBe(true);
  });

  it("falls back to rules when an extra provider fails", async () => {
    const failing: SuggestionProvider = {
      id: "failing",
      async getSuggestions() {
        throw new Error("boom");
      },
    };
    const result = await getTripSuggestions(context(), [failing]);
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((s) => s.source === "rules")).toBe(true);
  });
});
