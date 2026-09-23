import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { countryFlagUrl } from "./country-flag";
import { COUNTRIES } from "./countries";

describe("countryFlagUrl", () => {
  it("resolves known codes to a vendored asset path", () => {
    expect(countryFlagUrl("JP")).toBe("/flags/jp.svg");
    expect(countryFlagUrl("ES")).toBe("/flags/es.svg");
  });

  it("returns null for unknown or malformed codes", () => {
    expect(countryFlagUrl("ZZ")).toBeNull();
    expect(countryFlagUrl(null)).toBeNull();
    expect(countryFlagUrl(undefined)).toBeNull();
    expect(countryFlagUrl("")).toBeNull();
    expect(countryFlagUrl("jp")).toBeNull();
  });

  it("has a vendored SVG for every supported country", () => {
    for (const country of COUNTRIES) {
      const url = countryFlagUrl(country.code);
      expect(url).not.toBeNull();
      const file = resolve(process.cwd(), "public", url!.replace(/^\//, ""));
      expect(existsSync(file), `missing flag for ${country.code}`).toBe(true);
    }
  });
});
