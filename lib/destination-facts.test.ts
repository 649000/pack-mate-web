import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { COUNTRIES } from "./countries";

const SEED_MIGRATION = resolve(
  process.cwd(),
  "supabase/migrations/20260920020000_destination_facts_seed.sql",
);
const TABLE_MIGRATION = resolve(
  process.cwd(),
  "supabase/migrations/20260920010000_destination_facts.sql",
);

type SeedRow = {
  code: string;
  currency: string | null;
  calling: string | null;
  plugs: string[];
  voltage: string | null;
  frequency: string | null;
  zones: string[];
};

// The seed is generated with a fixed tuple shape, so a per-line parse is stable
// and keeps this test independent of a running database.
const TUPLE =
  /^\s*\('([A-Z]{2})',\s*(null|'[^']*'),\s*(null|'[^']*'),\s*(array\[[^\]]*\]|'\{\}'),\s*(null|'[^']*'),\s*(null|'[^']*'),\s*(array\[[^\]]*\]|'\{\}')\),?\s*$/;

function unquote(value: string): string | null {
  return value === "null" ? null : value.slice(1, -1);
}

function parseArray(value: string): string[] {
  if (value === "'{}'") return [];
  return [...value.matchAll(/'([^']*)'/g)].map((match) => match[1]);
}

function parseSeed(sql: string): SeedRow[] {
  const rows: SeedRow[] = [];
  for (const line of sql.split("\n")) {
    const match = TUPLE.exec(line);
    if (!match) continue;
    rows.push({
      code: match[1],
      currency: unquote(match[2]),
      calling: unquote(match[3]),
      plugs: parseArray(match[4]),
      voltage: unquote(match[5]),
      frequency: unquote(match[6]),
      zones: parseArray(match[7]),
    });
  }
  return rows;
}

const seed = parseSeed(readFileSync(SEED_MIGRATION, "utf8"));

describe("destination facts seed", () => {
  it("has exactly one row for every known country", () => {
    const codes = seed.map((row) => row.code);
    expect(new Set(codes).size).toBe(codes.length);
    expect([...codes].sort()).toEqual(COUNTRIES.map((country) => country.code).sort());
  });

  it("uses well-formed currency and calling codes", () => {
    for (const row of seed) {
      if (row.currency !== null) expect(row.currency).toMatch(/^[A-Z]{3}$/);
      if (row.calling !== null) expect(row.calling).toMatch(/^\+[0-9]+$/);
    }
  });

  it("uses only known plug letters", () => {
    for (const row of seed) {
      for (const plug of row.plugs) expect(plug).toMatch(/^[A-O]$/);
    }
  });

  it("uses well-formed voltage and frequency", () => {
    for (const row of seed) {
      if (row.voltage !== null) expect(row.voltage).toMatch(/^[0-9]+(\/[0-9]+)*$/);
      if (row.frequency !== null) expect(row.frequency).toMatch(/^[0-9]+(\/[0-9]+)*$/);
    }
  });

  it("uses IANA time zone identifiers", () => {
    for (const row of seed) {
      for (const zone of row.zones) expect(zone).toMatch(/^[A-Za-z_+-]+(\/[A-Za-z_+-]+)+$/);
    }
  });

  it("covers the countries the spec calls out", () => {
    const byCode = new Map(seed.map((row) => [row.code, row]));
    expect(byCode.get("JP")?.zones).toEqual(["Asia/Tokyo"]);
    expect(byCode.get("GB")?.plugs).toEqual(["G"]);
    expect(byCode.get("US")?.zones.length).toBeGreaterThan(1);
    expect(byCode.get("BR")?.plugs).toContain("N");
  });

  it("matches the country list allowed by the database check constraint", () => {
    const migration = readFileSync(TABLE_MIGRATION, "utf8");
    const match = migration.match(/country_code in \(([\s\S]*?)\)\s*\n\s*\),/);
    expect(match).not.toBeNull();
    const constraintCodes = [...match![1].matchAll(/'([A-Z]{2})'/g)].map((value) => value[1]);
    expect([...constraintCodes].sort()).toEqual(COUNTRIES.map((country) => country.code).sort());
  });
});
