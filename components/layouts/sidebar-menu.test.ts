import { describe, expect, it } from "vitest";
import { navGroups } from "./sidebar-menu";

describe("sidebar navigation", () => {
  it("includes the shared links page", () => {
    const paths = navGroups.flatMap((group) => group.items.map((item) => item.path));
    expect(paths).toContain("/shares");
  });

  it("keeps every item in a labelled group", () => {
    for (const group of navGroups) {
      expect(group.label.length).toBeGreaterThan(0);
      expect(group.items.length).toBeGreaterThan(0);
    }
  });
});
