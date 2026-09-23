import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { BAG_ICONS, BAG_ICON_KEYS, isBagIcon, resolveBagIconKey } from "./bag-icons";

describe("bag icons", () => {
  it("maps every key to an icon", () => {
    for (const key of BAG_ICON_KEYS) {
      expect(BAG_ICONS[key]).toBeDefined();
    }
  });

  it("has unique keys", () => {
    expect(new Set(BAG_ICON_KEYS).size).toBe(BAG_ICON_KEYS.length);
  });

  it("matches the values allowed by the database check constraint", () => {
    const migration = readFileSync(
      resolve(process.cwd(), "supabase/migrations/20260923000000_bag_icons.sql"),
      "utf8",
    );
    const match = migration.match(
      /reusable_bags_icon_valid check \(\s*icon is null or icon in \(([^)]*)\)/,
    );
    expect(match).not.toBeNull();
    const constraintKeys = [...match![1].matchAll(/'([a-z_]+)'/g)].map((value) => value[1]);
    expect([...constraintKeys].sort()).toEqual([...BAG_ICON_KEYS].sort());
  });

  it("recognises known keys only", () => {
    expect(isBagIcon("backpack")).toBe(true);
    expect(isBagIcon("spaceship")).toBe(false);
    expect(isBagIcon(null)).toBe(false);
    expect(isBagIcon(undefined)).toBe(false);
  });
});

describe("resolveBagIconKey", () => {
  it("prefers the user's chosen icon", () => {
    expect(resolveBagIconKey("camera", ["toiletries"])).toBe("camera");
  });

  it("derives from the dominant content category when unset", () => {
    expect(resolveBagIconKey(null, ["toiletries", "toiletries", "clothing"])).toBe("toiletry");
    expect(resolveBagIconKey(null, ["electronics"])).toBe("electronics");
    expect(resolveBagIconKey(null, ["footwear", "clothing", "clothing"])).toBe("clothing");
  });

  it("falls back to the generic icon", () => {
    expect(resolveBagIconKey(null, [])).toBe("other");
    expect(resolveBagIconKey("nope", [null])).toBe("other");
  });
});
