import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { COUNTRIES, countryName, formatDestination, isCountryCode } from "./countries";

describe("countries", () => {
  it("has a unique, well-formed code and a non-empty name for every entry", () => {
    const codes = COUNTRIES.map((country) => country.code);
    expect(new Set(codes).size).toBe(codes.length);
    for (const country of COUNTRIES) {
      expect(country.code).toMatch(/^[A-Z]{2}$/);
      expect(country.name.trim().length).toBeGreaterThan(0);
    }
  });

  it("recognises known codes only", () => {
    expect(isCountryCode("JP")).toBe(true);
    expect(isCountryCode("ZZ")).toBe(false);
    expect(isCountryCode("jp")).toBe(false);
    expect(isCountryCode("")).toBe(false);
    expect(isCountryCode(null)).toBe(false);
  });

  it("maps a code to its name", () => {
    expect(countryName("JP")).toBe("Japan");
    expect(countryName("ZZ")).toBeNull();
    expect(countryName(null)).toBeNull();
  });

  it("matches the values allowed by the database check constraint", () => {
    const migration = readFileSync(
      resolve(process.cwd(), "supabase/migrations/20260920000000_trip_destination.sql"),
      "utf8",
    );
    const match = migration.match(/country_code in \(([^)]*)\)/);
    expect(match).not.toBeNull();
    const constraintCodes = [...match![1].matchAll(/'([A-Z]{2})'/g)].map((value) => value[1]);
    const localCodes = COUNTRIES.map((country) => country.code);
    expect([...constraintCodes].sort()).toEqual([...localCodes].sort());
  });
});

describe("formatDestination", () => {
  it("combines a place and country name", () => {
    expect(formatDestination("Kyoto", "JP")).toBe("Kyoto, Japan");
  });

  it("falls back to whichever part is present", () => {
    expect(formatDestination(null, "JP")).toBe("Japan");
    expect(formatDestination("Kyoto", null)).toBe("Kyoto");
    expect(formatDestination("  ", null)).toBeNull();
    expect(formatDestination(null, null)).toBeNull();
  });

  it("never renders the raw code", () => {
    expect(formatDestination(null, "JP")).not.toContain("JP");
  });
});
