import { describe, expect, it } from "vitest";
import {
  currencySymbol,
  formatDifference,
  referenceDate,
  resolveTimeZones,
  zoneCity,
  zoneOffsetMinutes,
} from "./destination-facts";
import type { DestinationFacts } from "./types";

function facts(overrides: Partial<DestinationFacts>): DestinationFacts {
  return {
    country_code: "US",
    currency_code: "USD",
    calling_code: "+1",
    plug_types: ["A", "B"],
    voltage: "120",
    frequency: "60",
    timezones: [],
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

const US_ZONES = [
  "America/Adak",
  "Pacific/Honolulu",
  "America/Anchorage",
  "America/Los_Angeles",
  "America/Denver",
  "America/Phoenix",
  "America/Chicago",
  "America/New_York",
];

describe("zoneCity", () => {
  it("turns an IANA id into a display city", () => {
    expect(zoneCity("America/Los_Angeles")).toBe("Los Angeles");
    expect(zoneCity("America/Argentina/Buenos_Aires")).toBe("Buenos Aires");
    expect(zoneCity("Asia/Tokyo")).toBe("Tokyo");
  });
});

describe("zoneOffsetMinutes", () => {
  it("reflects daylight saving at the given instant", () => {
    const january = new Date("2026-01-15T12:00:00Z");
    const july = new Date("2026-07-15T12:00:00Z");
    expect(zoneOffsetMinutes("America/New_York", january)).toBe(-300);
    expect(zoneOffsetMinutes("America/New_York", july)).toBe(-240);
  });
});

describe("formatDifference", () => {
  it("describes ahead, behind, same time and half-hour offsets", () => {
    expect(formatDifference(480)).toBe("8 hours ahead");
    expect(formatDifference(-330)).toBe("5 hours 30 minutes behind");
    expect(formatDifference(0)).toBe("same time");
    expect(formatDifference(60)).toBe("1 hour ahead");
    expect(formatDifference(90)).toBe("1 hour 30 minutes ahead");
  });
});

describe("currencySymbol", () => {
  it("derives a symbol from the code", () => {
    expect(currencySymbol("JPY")).toBe("¥");
    expect(currencySymbol("USD")).toBe("$");
  });

  it("returns null for a missing or unknown code", () => {
    expect(currencySymbol(null)).toBeNull();
    expect(currencySymbol("ZZZ")).toBeNull();
  });
});

describe("referenceDate", () => {
  it("uses the trip start date when present", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    expect(referenceDate("2026-04-01", now).toISOString()).toBe("2026-04-01T12:00:00.000Z");
  });

  it("falls back to now without a start date", () => {
    const now = new Date("2026-01-01T00:00:00Z");
    expect(referenceDate(null, now)).toBe(now);
  });
});

describe("resolveTimeZones", () => {
  const at = new Date("2026-01-15T12:00:00Z");

  it("picks the zone whose city the destination names", () => {
    const result = resolveTimeZones({
      facts: facts({ timezones: US_ZONES }),
      destination: "Los Angeles",
      at,
      viewerZone: "Asia/Tokyo",
    });
    expect(result.map((info) => info.zone)).toEqual(["America/Los_Angeles"]);
  });

  it("lists every zone when the destination matches no city", () => {
    const result = resolveTimeZones({
      facts: facts({ timezones: US_ZONES }),
      destination: "San Francisco",
      at,
      viewerZone: "Asia/Tokyo",
    });
    expect(result.map((info) => info.zone)).toEqual(US_ZONES);
  });

  it("shows the single zone of a single-zone country", () => {
    const result = resolveTimeZones({
      facts: facts({ country_code: "GB", timezones: ["Europe/London"] }),
      destination: "Manchester",
      at,
      viewerZone: "Asia/Tokyo",
    });
    expect(result.map((info) => info.zone)).toEqual(["Europe/London"]);
  });

  it("returns nothing when a country has no zones", () => {
    expect(
      resolveTimeZones({
        facts: facts({ timezones: [] }),
        destination: "Anywhere",
        at,
        viewerZone: "Asia/Tokyo",
      }),
    ).toEqual([]);
  });

  it("computes the difference at the given instant, so DST is reflected", () => {
    const january = resolveTimeZones({
      facts: facts({ timezones: US_ZONES }),
      destination: "New York",
      at: new Date("2026-01-15T12:00:00Z"),
      viewerZone: "Asia/Tokyo",
    });
    const july = resolveTimeZones({
      facts: facts({ timezones: US_ZONES }),
      destination: "New York",
      at: new Date("2026-07-15T12:00:00Z"),
      viewerZone: "Asia/Tokyo",
    });
    expect(january[0]?.differenceLabel).toBe("14 hours behind");
    expect(july[0]?.differenceLabel).toBe("13 hours behind");
  });
});
