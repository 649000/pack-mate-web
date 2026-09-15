import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  ITEM_CATEGORIES,
  MAX_DESCRIPTION_LENGTH,
  MAX_WEIGHT_GRAMS,
  ValidationError,
  parseQty,
  validateBirthday,
  validateCategory,
  validateDateRange,
  validateEmail,
  validateGender,
  validateName,
  validateOptionalDescription,
  validateOptionalName,
  validateOptionalUrl,
  validatePassword,
  validateQty,
  validateWeight,
  validateWeightLimit,
  validateWeightUnit,
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

describe("validateOptionalName", () => {
  it("trims and returns a name", () => {
    expect(validateOptionalName("  Ada  ")).toBe("Ada");
  });

  it("returns null for blank input", () => {
    expect(validateOptionalName("")).toBeNull();
    expect(validateOptionalName("   ")).toBeNull();
    expect(validateOptionalName(null)).toBeNull();
    expect(validateOptionalName(undefined)).toBeNull();
  });

  it("rejects names that are too long", () => {
    expect(() => validateOptionalName("a".repeat(81))).toThrow(ValidationError);
  });
});

describe("validateOptionalUrl", () => {
  it("accepts http and https URLs", () => {
    expect(validateOptionalUrl("https://example.com/item")).toBe("https://example.com/item");
    expect(validateOptionalUrl("  http://example.com  ")).toBe("http://example.com");
  });

  it("returns null for blank input", () => {
    expect(validateOptionalUrl("")).toBeNull();
    expect(validateOptionalUrl("   ")).toBeNull();
    expect(validateOptionalUrl(null)).toBeNull();
    expect(validateOptionalUrl(undefined)).toBeNull();
  });

  it("rejects non-http(s) URLs", () => {
    expect(() => validateOptionalUrl("javascript:alert(1)")).toThrow(ValidationError);
    expect(() => validateOptionalUrl("data:text/html,x")).toThrow(ValidationError);
    expect(() => validateOptionalUrl("example.com")).toThrow(ValidationError);
    expect(() => validateOptionalUrl("ftp://example.com")).toThrow(ValidationError);
  });
});

describe("validateOptionalDescription", () => {
  it("trims and returns a description", () => {
    expect(validateOptionalDescription("  Navy cover  ")).toBe("Navy cover");
  });

  it("returns null for blank input", () => {
    expect(validateOptionalDescription("")).toBeNull();
    expect(validateOptionalDescription("   ")).toBeNull();
    expect(validateOptionalDescription(null)).toBeNull();
  });

  it("rejects a description beyond the maximum length", () => {
    expect(validateOptionalDescription("a".repeat(MAX_DESCRIPTION_LENGTH))).toHaveLength(
      MAX_DESCRIPTION_LENGTH,
    );
    expect(() => validateOptionalDescription("a".repeat(MAX_DESCRIPTION_LENGTH + 1))).toThrow(
      ValidationError,
    );
  });
});

describe("validateWeight", () => {
  it("accepts zero and positive numbers", () => {
    expect(validateWeight(0)).toBe(0);
    expect(validateWeight(1200)).toBe(1200);
  });

  it("returns null for null and undefined", () => {
    expect(validateWeight(null)).toBeNull();
    expect(validateWeight(undefined)).toBeNull();
  });

  it("rejects negative, non-numeric and excessive values", () => {
    expect(() => validateWeight(-1)).toThrow(ValidationError);
    expect(() => validateWeight(Number.NaN)).toThrow(ValidationError);
    expect(() => validateWeight(Number.POSITIVE_INFINITY)).toThrow(ValidationError);
    expect(() => validateWeight(MAX_WEIGHT_GRAMS + 1)).toThrow(ValidationError);
  });

  it("uses the field label in the error", () => {
    expect(() => validateWeight(-1, "Weight limit")).toThrow(/weight limit/i);
  });
});

describe("validateWeightLimit", () => {
  it("accepts a valid limit and null", () => {
    expect(validateWeightLimit(23000)).toBe(23000);
    expect(validateWeightLimit(null)).toBeNull();
  });

  it("rejects invalid limits", () => {
    expect(() => validateWeightLimit(-1)).toThrow(/weight limit/i);
    expect(() => validateWeightLimit(MAX_WEIGHT_GRAMS + 1)).toThrow(ValidationError);
  });
});

describe("validateWeightUnit", () => {
  it("accepts kg and lb", () => {
    expect(validateWeightUnit("kg")).toBe("kg");
    expect(validateWeightUnit("lb")).toBe("lb");
  });

  it("defaults blank input to kg", () => {
    expect(validateWeightUnit("")).toBe("kg");
    expect(validateWeightUnit(null)).toBe("kg");
  });

  it("rejects unknown units", () => {
    expect(() => validateWeightUnit("stone")).toThrow(ValidationError);
  });
});

describe("validateBirthday", () => {
  it("accepts an ISO date in the past", () => {
    expect(validateBirthday("1990-05-28")).toBe("1990-05-28");
  });

  it("returns null for blank input", () => {
    expect(validateBirthday("")).toBeNull();
    expect(validateBirthday(null)).toBeNull();
  });

  it("rejects malformed and impossible dates", () => {
    expect(() => validateBirthday("28-05-1990")).toThrow(ValidationError);
    expect(() => validateBirthday("2026-02-31")).toThrow(ValidationError);
  });

  it("rejects a future date", () => {
    const future = new Date(Date.now() + 1000 * 60 * 60 * 24 * 365).toISOString().slice(0, 10);
    expect(() => validateBirthday(future)).toThrow(ValidationError);
  });
});

describe("validateGender", () => {
  it("accepts an allowed value", () => {
    expect(validateGender("female")).toBe("female");
    expect(validateGender("prefer_not_to_say")).toBe("prefer_not_to_say");
  });

  it("returns null for blank input", () => {
    expect(validateGender("")).toBeNull();
    expect(validateGender(null)).toBeNull();
  });

  it("rejects a value outside the allowed set", () => {
    expect(() => validateGender("unknown")).toThrow(ValidationError);
  });
});

describe("validateCategory", () => {
  it("accepts every category in the fixed set", () => {
    for (const category of ITEM_CATEGORIES) {
      expect(validateCategory(category)).toBe(category);
    }
  });

  it("returns null for blank input", () => {
    expect(validateCategory("")).toBeNull();
    expect(validateCategory("   ")).toBeNull();
    expect(validateCategory(null)).toBeNull();
    expect(validateCategory(undefined)).toBeNull();
  });

  it("trims a valid value", () => {
    expect(validateCategory("  clothing  ")).toBe("clothing");
  });

  it("rejects a value outside the allowed set", () => {
    expect(() => validateCategory("other")).toThrow(ValidationError);
    expect(() => validateCategory("unknown")).toThrow(/valid category/i);
  });
});

describe("ITEM_CATEGORIES", () => {
  const migration = readFileSync(
    resolve(process.cwd(), "supabase/migrations/20260915040000_item_categories.sql"),
    "utf8",
  );

  function constraintCategories(sql: string): string[][] {
    return [...sql.matchAll(/category is null or category in \(([^)]*)\)/g)].map((match) =>
      [...match[1].matchAll(/'([^']+)'/g)].map((value) => value[1]),
    );
  }

  it("matches the values allowed by both database check constraints", () => {
    const groups = constraintCategories(migration);
    expect(groups).toHaveLength(2);
    for (const group of groups) {
      expect([...group].sort()).toEqual([...ITEM_CATEGORIES].sort());
    }
  });
});

describe("validateEmail", () => {
  it("trims and returns a valid address", () => {
    expect(validateEmail("  ada@example.com  ")).toBe("ada@example.com");
  });

  it("rejects invalid addresses", () => {
    expect(() => validateEmail("ada")).toThrow(ValidationError);
    expect(() => validateEmail("ada@example")).toThrow(ValidationError);
    expect(() => validateEmail("@example.com")).toThrow(ValidationError);
  });
});

describe("validatePassword", () => {
  it("accepts a password at the minimum length", () => {
    expect(validatePassword("12345678")).toBe("12345678");
  });

  it("rejects a password below the minimum length", () => {
    expect(() => validatePassword("1234567")).toThrow(ValidationError);
    expect(() => validatePassword("1234567")).toThrow(/at least 8/i);
  });
});
