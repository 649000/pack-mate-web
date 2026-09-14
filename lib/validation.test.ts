import { describe, expect, it } from "vitest";
import {
  ValidationError,
  parseQty,
  validateDateRange,
  validateName,
  validateQty,
} from "./validation";

describe("validateName", () => {
  it("trims and returns a valid name", () => {
    expect(validateName("  Passport  ")).toBe("Passport");
  });

  it("rejects blank names", () => {
    expect(() => validateName("   ")).toThrow(ValidationError);
    expect(() => validateName("")).toThrow("Name is required");
  });

  it("uses the provided field label in the error", () => {
    expect(() => validateName("", "Trip name")).toThrow("Trip name is required");
  });
});

describe("validateQty", () => {
  it("accepts positive integers", () => {
    expect(validateQty(1)).toBe(1);
    expect(validateQty(3)).toBe(3);
  });

  it("rejects zero, negatives, and non-integers", () => {
    expect(() => validateQty(0)).toThrow(ValidationError);
    expect(() => validateQty(-1)).toThrow(ValidationError);
    expect(() => validateQty(1.5)).toThrow(ValidationError);
  });
});

describe("parseQty", () => {
  it("parses numeric strings", () => {
    expect(parseQty("4")).toBe(4);
  });

  it("rejects non-numeric and invalid values", () => {
    expect(() => parseQty("abc")).toThrow(ValidationError);
    expect(() => parseQty("0")).toThrow(ValidationError);
    expect(() => parseQty("-2")).toThrow(ValidationError);
  });
});

describe("validateDateRange", () => {
  it("accepts empty and ordered ranges", () => {
    expect(validateDateRange(null, null)).toEqual({ startDate: null, endDate: null });
    expect(validateDateRange("2026-01-01", "2026-01-05")).toEqual({
      startDate: "2026-01-01",
      endDate: "2026-01-05",
    });
  });

  it("accepts a single-sided range", () => {
    expect(validateDateRange("2026-01-01", null)).toEqual({
      startDate: "2026-01-01",
      endDate: null,
    });
  });

  it("rejects an end before the start", () => {
    expect(() => validateDateRange("2026-01-05", "2026-01-01")).toThrow(ValidationError);
  });
});
