import { describe, expect, it } from "vitest";
import { duplicateTripDefaults } from "./trip-duplicate";
import type { Trip } from "./types";

const trip: Trip = {
  id: "t1",
  user_id: "u1",
  name: "Japan",
  destination: "Kyoto",
  country_code: "JP",
  start_date: "2026-03-01",
  end_date: "2026-03-10",
  created_at: "2026-01-01T00:00:00Z",
};

describe("duplicateTripDefaults", () => {
  it("prefills name, country and destination and clears the dates", () => {
    expect(duplicateTripDefaults(trip)).toEqual({
      name: "Japan (copy)",
      destination: "Kyoto",
      countryCode: "JP",
      startDate: null,
      endDate: null,
    });
  });

  it("keeps a trip without dates and destination copyable", () => {
    const bare: Trip = { ...trip, destination: null, start_date: null, end_date: null };

    expect(duplicateTripDefaults(bare)).toEqual({
      name: "Japan (copy)",
      destination: null,
      countryCode: "JP",
      startDate: null,
      endDate: null,
    });
  });
});
