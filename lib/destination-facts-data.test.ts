import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const maybeSingle = vi.fn();
  const eq = vi.fn(() => ({ maybeSingle }));
  const select = vi.fn(() => ({ eq, maybeSingle }));
  const from = vi.fn(() => ({ select }));
  return { from, select, eq, maybeSingle };
});

vi.mock("./supabase", () => ({ supabase: { from: mocks.from } }));
vi.mock("./firebase", () => ({ getFirebaseAuth: () => ({ currentUser: null }) }));

import { getDestinationFacts } from "./data";

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getDestinationFacts", () => {
  it("returns the row for a known country", async () => {
    const row = {
      country_code: "JP",
      currency_code: "JPY",
      calling_code: "+81",
      plug_types: ["A", "B"],
      voltage: "100",
      frequency: "50/60",
      timezones: ["Asia/Tokyo"],
      updated_at: "2026-01-01T00:00:00Z",
    };
    mocks.maybeSingle.mockResolvedValue({ data: row, error: null });

    await expect(getDestinationFacts("JP")).resolves.toEqual(row);
    expect(mocks.from).toHaveBeenCalledWith("destination_facts");
    expect(mocks.eq).toHaveBeenCalledWith("country_code", "JP");
  });

  it("returns null for a country with no facts", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null, error: null });
    await expect(getDestinationFacts("ZZ")).resolves.toBeNull();
  });

  it("throws on a query error", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null, error: { message: "boom" } });
    await expect(getDestinationFacts("JP")).rejects.toThrow("boom");
  });
});
