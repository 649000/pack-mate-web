import { describe, expect, it } from "vitest";
import { CATEGORY_ICONS, CATEGORY_ICON_FALLBACK, categoryIcon } from "./category-icons";
import { ITEM_CATEGORIES } from "./validation";

describe("category icons", () => {
  it("maps every defined category to an icon", () => {
    for (const category of ITEM_CATEGORIES) {
      expect(CATEGORY_ICONS[category]).toBeDefined();
    }
  });

  it("has no stale mappings beyond the defined categories", () => {
    expect(Object.keys(CATEGORY_ICONS).sort()).toEqual([...ITEM_CATEGORIES].sort());
  });

  it("falls back to the placeholder for uncategorised items", () => {
    expect(categoryIcon(null)).toBe(CATEGORY_ICON_FALLBACK);
    expect(categoryIcon("clothing")).toBe(CATEGORY_ICONS.clothing);
  });
});
