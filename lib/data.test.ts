import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const result: { data: unknown; error: unknown } = { data: null, error: null };
  const single = vi.fn(() => Promise.resolve(result));
  const maybeSingle = vi.fn(() => Promise.resolve(result));
  const chain: Record<string, unknown> = {};
  const select = vi.fn(() => chain);
  const eq = vi.fn(() => chain);
  const update = vi.fn(() => chain);
  const insert = vi.fn(() => chain);
  const upsert = vi.fn(() => chain);
  const order = vi.fn(() => chain);
  const rpc = vi.fn(() => Promise.resolve(result));
  chain.select = select;
  chain.eq = eq;
  chain.update = update;
  chain.insert = insert;
  chain.upsert = upsert;
  chain.order = order;
  chain.single = single;
  chain.maybeSingle = maybeSingle;
  const from = vi.fn(() => chain);
  return { from, upsert, insert, update, eq, select, single, maybeSingle, order, rpc };
});

const authState = vi.hoisted(() => ({
  currentUser: { uid: "u1" } as { uid: string } | null,
}));

vi.mock("./supabase", () => ({ supabase: { from: mocks.from, rpc: mocks.rpc } }));
vi.mock("./firebase", () => ({ getFirebaseAuth: () => authState }));

import {
  createBag,
  createItem,
  createTrip,
  duplicateBag,
  duplicateTrip,
  getProfile,
  setBagParent,
  setTripPacked,
  updateBag,
  updateEntry,
  updateItem,
  updateProfileTheme,
  updateTrip,
  upsertProfile,
} from "./data";
import type { ItemCategory, TripBag } from "./types";

beforeEach(() => {
  vi.clearAllMocks();
  authState.currentUser = { uid: "u1" };
});

describe("upsertProfile", () => {
  it("validates, writes and returns the stored profile", async () => {
    const row = {
      user_id: "u1",
      display_name: "Ada",
      birthday: null,
      gender: "female",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };
    mocks.single.mockResolvedValue({ data: row, error: null });

    const result = await upsertProfile({
      displayName: "  Ada  ",
      birthday: null,
      gender: "female",
    });

    expect(result).toEqual(row);
    expect(mocks.from).toHaveBeenCalledWith("profiles");
    expect(mocks.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "u1",
        display_name: "Ada",
        birthday: null,
        gender: "female",
      }),
      { onConflict: "user_id" },
    );
  });

  it("rejects an invalid gender before writing", async () => {
    await expect(
      upsertProfile({ displayName: null, birthday: null, gender: "unknown" }),
    ).rejects.toThrow(/valid gender/i);
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("requires a signed-in user", async () => {
    authState.currentUser = null;
    await expect(
      upsertProfile({ displayName: null, birthday: null, gender: null }),
    ).rejects.toThrow(/signed in/i);
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("stores the chosen weight unit", async () => {
    const row = {
      user_id: "u1",
      display_name: null,
      birthday: null,
      gender: null,
      weight_unit: "lb",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };
    mocks.single.mockResolvedValue({ data: row, error: null });

    await upsertProfile({ displayName: null, birthday: null, gender: null, weightUnit: "lb" });

    expect(mocks.upsert).toHaveBeenCalledWith(expect.objectContaining({ weight_unit: "lb" }), {
      onConflict: "user_id",
    });
  });

  it("rejects an unknown weight unit before writing", async () => {
    await expect(
      upsertProfile({ displayName: null, birthday: null, gender: null, weightUnit: "stone" }),
    ).rejects.toThrow(/weight unit/i);
    expect(mocks.upsert).not.toHaveBeenCalled();
  });
});

describe("getProfile", () => {
  it("returns null when no profile row exists", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null, error: null });
    await expect(getProfile()).resolves.toBeNull();
  });

  it("returns the profile row", async () => {
    const row = {
      user_id: "u1",
      display_name: "Ada",
      birthday: "1990-05-28",
      gender: "female",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };
    mocks.maybeSingle.mockResolvedValue({ data: row, error: null });
    await expect(getProfile()).resolves.toEqual(row);
  });
});

describe("createItem", () => {
  it("validates and writes the item details", async () => {
    const row = {
      id: "i1",
      user_id: "u1",
      name: "Passport",
      default_qty: 1,
      description: "Navy cover",
      link: "https://example.com/passport",
      image_url: "https://example.com/passport.jpg",
      weight_grams: 120,
      created_at: "2026-01-01T00:00:00Z",
    };
    mocks.single.mockResolvedValue({ data: row, error: null });

    await expect(
      createItem({
        name: "  Passport  ",
        defaultQty: 1,
        description: "  Navy cover  ",
        link: "  https://example.com/passport  ",
        imageUrl: "https://example.com/passport.jpg",
        weightGrams: 120,
      }),
    ).resolves.toEqual(row);

    expect(mocks.from).toHaveBeenCalledWith("reusable_items");
    expect(mocks.insert).toHaveBeenCalledWith({
      name: "Passport",
      default_qty: 1,
      description: "Navy cover",
      link: "https://example.com/passport",
      image_url: "https://example.com/passport.jpg",
      weight_grams: 120,
      category: null,
    });
  });

  it("rejects a non-http link before writing", async () => {
    await expect(
      createItem({ name: "Passport", defaultQty: 1, link: "javascript:alert(1)" }),
    ).rejects.toThrow(/http/i);
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("rejects a negative weight before writing", async () => {
    await expect(createItem({ name: "Passport", defaultQty: 1, weightGrams: -1 })).rejects.toThrow(
      /weight/i,
    );
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("validates and writes a category", async () => {
    mocks.single.mockResolvedValue({ data: { id: "i1" }, error: null });

    await createItem({ name: "Tee", defaultQty: 1, category: "clothing" });

    expect(mocks.insert).toHaveBeenCalledWith(expect.objectContaining({ category: "clothing" }));
  });

  it("rejects an unknown category before writing", async () => {
    await expect(
      createItem({ name: "Tee", defaultQty: 1, category: "unknown" as ItemCategory }),
    ).rejects.toThrow(/valid category/i);
    expect(mocks.insert).not.toHaveBeenCalled();
  });
});

describe("updateItem", () => {
  it("writes nulls when details are cleared", async () => {
    mocks.single.mockResolvedValue({ data: {}, error: null });

    await updateItem("i1", {
      name: "Passport",
      defaultQty: 1,
      description: null,
      link: null,
      imageUrl: null,
      weightGrams: null,
      category: null,
    });

    expect(mocks.update).toHaveBeenCalledWith({
      name: "Passport",
      default_qty: 1,
      description: null,
      link: null,
      image_url: null,
      weight_grams: null,
      category: null,
    });
  });

  it("changes a category", async () => {
    mocks.single.mockResolvedValue({ data: { id: "i1" }, error: null });

    await updateItem("i1", { name: "Tee", defaultQty: 1, category: "clothing" });

    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ category: "clothing" }));
  });
});

describe("createBag / updateBag", () => {
  it("writes a weight limit", async () => {
    mocks.single.mockResolvedValue({ data: { id: "b1" }, error: null });

    await createBag({ name: "Main", weightLimitGrams: 23000 });

    expect(mocks.from).toHaveBeenCalledWith("reusable_bags");
    expect(mocks.insert).toHaveBeenCalledWith({
      name: "Main",
      weight_limit_grams: 23000,
      icon: null,
    });
  });

  it("writes a chosen icon", async () => {
    mocks.single.mockResolvedValue({ data: { id: "b1" }, error: null });

    await createBag({ name: "Camera", icon: "camera" });

    expect(mocks.insert).toHaveBeenCalledWith({
      name: "Camera",
      weight_limit_grams: null,
      icon: "camera",
    });
  });

  it("rejects an unknown icon before writing", async () => {
    await expect(createBag({ name: "Main", icon: "spaceship" as never })).rejects.toThrow(
      /bag icon/i,
    );
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("rejects a negative limit before writing", async () => {
    await expect(createBag({ name: "Main", weightLimitGrams: -1 })).rejects.toThrow(
      /weight limit/i,
    );
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("clears the limit with null on update", async () => {
    mocks.single.mockResolvedValue({ data: {}, error: null });

    await updateBag("b1", { name: "Main", weightLimitGrams: null });

    expect(mocks.update).toHaveBeenCalledWith({
      name: "Main",
      weight_limit_grams: null,
      icon: null,
    });
  });
});

describe("setBagParent", () => {
  const bag: TripBag = {
    id: "b1",
    trip_id: "t1",
    name: "Toiletry",
    source_bag_id: null,
    position: 0,
    weight_limit_grams: null,
    parent_bag_id: null,
    icon: null,
  };
  const parent: TripBag = { ...bag, id: "b0", name: "Suitcase" };

  it("nests a bag under a same-trip parent", async () => {
    mocks.single.mockResolvedValue({ data: { ...bag, parent_bag_id: "b0" }, error: null });

    await setBagParent(bag, parent);

    expect(mocks.from).toHaveBeenCalledWith("trip_bags");
    expect(mocks.update).toHaveBeenCalledWith({ parent_bag_id: "b0" });
  });

  it("moves a bag back to the top level", async () => {
    mocks.single.mockResolvedValue({ data: { ...bag, parent_bag_id: null }, error: null });

    await setBagParent({ ...bag, parent_bag_id: "b0" }, null);

    expect(mocks.update).toHaveBeenCalledWith({ parent_bag_id: null });
  });

  it("rejects a parent from another trip before writing", async () => {
    await expect(setBagParent(bag, { ...parent, trip_id: "t2" })).rejects.toThrow(/same trip/i);
    expect(mocks.update).not.toHaveBeenCalled();
  });
});

describe("updateEntry", () => {
  it("writes details only to trip_entries", async () => {
    mocks.single.mockResolvedValue({ data: { id: "e1" }, error: null });

    await updateEntry("e1", { description: "  Navy  ", link: "https://example.com" });

    expect(mocks.from).toHaveBeenCalledWith("trip_entries");
    expect(mocks.from).not.toHaveBeenCalledWith("reusable_items");
    expect(mocks.update).toHaveBeenCalledWith({
      description: "Navy",
      link: "https://example.com",
    });
  });

  it("validates an entry weight", async () => {
    mocks.single.mockResolvedValue({ data: { id: "e1" }, error: null });

    await updateEntry("e1", { weight_grams: 500 });

    expect(mocks.update).toHaveBeenCalledWith({ weight_grams: 500 });
  });

  it("rejects a negative entry weight before writing", async () => {
    await expect(updateEntry("e1", { weight_grams: -1 })).rejects.toThrow(/weight/i);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("rejects a non-http image URL before writing", async () => {
    await expect(updateEntry("e1", { image_url: "not-a-url" })).rejects.toThrow(/http/i);
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("writes a category only to the trip entry, leaving the library untouched", async () => {
    mocks.single.mockResolvedValue({ data: { id: "e1" }, error: null });

    await updateEntry("e1", { category: "clothing" });

    expect(mocks.from).toHaveBeenCalledWith("trip_entries");
    expect(mocks.from).not.toHaveBeenCalledWith("reusable_items");
    expect(mocks.update).toHaveBeenCalledWith({ category: "clothing" });
  });

  it("clears a category with null", async () => {
    mocks.single.mockResolvedValue({ data: { id: "e1" }, error: null });

    await updateEntry("e1", { category: null });

    expect(mocks.update).toHaveBeenCalledWith({ category: null });
  });

  it("rejects an unknown category before writing", async () => {
    await expect(updateEntry("e1", { category: "unknown" as ItemCategory })).rejects.toThrow(
      /valid category/i,
    );
    expect(mocks.update).not.toHaveBeenCalled();
  });
});

describe("createTrip and updateTrip", () => {
  it("validates and writes the destination and country", async () => {
    const row = { id: "t1", name: "Kyoto", destination: "Kyoto", country_code: "JP" };
    mocks.single.mockResolvedValue({ data: row, error: null });

    await expect(
      createTrip({
        name: "  Kyoto  ",
        destination: "  Kyoto  ",
        countryCode: "jp",
        startDate: null,
        endDate: null,
      }),
    ).resolves.toEqual(row);

    expect(mocks.from).toHaveBeenCalledWith("trips");
    expect(mocks.insert).toHaveBeenCalledWith({
      name: "Kyoto",
      destination: "Kyoto",
      country_code: "JP",
      start_date: null,
      end_date: null,
    });
  });

  it("allows a trip without a destination", async () => {
    mocks.single.mockResolvedValue({ data: { id: "t1" }, error: null });

    await createTrip({
      name: "France",
      destination: "   ",
      countryCode: "FR",
      startDate: null,
      endDate: null,
    });

    expect(mocks.insert).toHaveBeenCalledWith({
      name: "France",
      destination: null,
      country_code: "FR",
      start_date: null,
      end_date: null,
    });
  });

  it("rejects an unknown country before writing", async () => {
    await expect(
      createTrip({
        name: "Nowhere",
        destination: null,
        countryCode: "ZZ",
        startDate: null,
        endDate: null,
      }),
    ).rejects.toThrow(/valid country/i);
    expect(mocks.insert).not.toHaveBeenCalled();
  });

  it("updates a trip with its destination and country", async () => {
    mocks.single.mockResolvedValue({ data: { id: "t1" }, error: null });

    await updateTrip("t1", {
      name: "Iceland",
      destination: "Reykjavik",
      countryCode: "IS",
      startDate: null,
      endDate: null,
    });

    expect(mocks.update).toHaveBeenCalledWith({
      name: "Iceland",
      destination: "Reykjavik",
      country_code: "IS",
      start_date: null,
      end_date: null,
    });
  });
});

describe("duplicateTrip", () => {
  it("validates the fields and calls the duplicate RPC with the source id", async () => {
    mocks.rpc.mockResolvedValue({ data: "t2", error: null });
    mocks.single.mockResolvedValue({ data: { id: "t2", name: "Kyoto copy" }, error: null });

    await duplicateTrip("t1", {
      name: "  Kyoto copy  ",
      destination: "  Osaka  ",
      countryCode: "jp",
      startDate: null,
      endDate: null,
    });

    expect(mocks.rpc).toHaveBeenCalledWith("duplicate_trip", {
      p_source_trip_id: "t1",
      p_name: "Kyoto copy",
      p_country_code: "JP",
      p_destination: "Osaka",
      p_start_date: null,
      p_end_date: null,
    });
    expect(mocks.from).toHaveBeenCalledWith("trips");
  });

  it("rejects an unknown country before calling the RPC", async () => {
    await expect(
      duplicateTrip("t1", {
        name: "Nowhere",
        destination: null,
        countryCode: "ZZ",
        startDate: null,
        endDate: null,
      }),
    ).rejects.toThrow(/valid country/i);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("surfaces an RPC error", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { message: "trip not found" } });

    await expect(
      duplicateTrip("t1", {
        name: "Japan",
        destination: null,
        countryCode: "JP",
        startDate: null,
        endDate: null,
      }),
    ).rejects.toThrow("trip not found");
  });
});

describe("setTripPacked", () => {
  it("calls the bulk packed RPC for the trip", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: null });

    await setTripPacked("t1", true);

    expect(mocks.rpc).toHaveBeenCalledWith("set_trip_packed", {
      p_trip_id: "t1",
      p_packed: true,
    });
  });

  it("surfaces an RPC error", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { message: "trip not found" } });

    await expect(setTripPacked("t1", false)).rejects.toThrow("trip not found");
  });
});

describe("updateProfileTheme", () => {
  it("writes only the theme and updated_at", async () => {
    await updateProfileTheme("dark");

    expect(mocks.from).toHaveBeenCalledWith("profiles");
    expect(mocks.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "u1", theme: "dark" }),
      { onConflict: "user_id" },
    );
  });

  it("rejects an unknown theme before writing", async () => {
    await expect(updateProfileTheme("sepia" as never)).rejects.toThrow(/theme/i);
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("requires a signed-in user", async () => {
    authState.currentUser = null;
    await expect(updateProfileTheme("dark")).rejects.toThrow(/signed in/i);
  });
});

describe("duplicateBag", () => {
  it("duplicates through the database function and returns the copy", async () => {
    mocks.rpc.mockResolvedValue({ data: "b2", error: null });
    mocks.single.mockResolvedValue({
      data: { id: "b2", name: "Main (copy)" },
      error: null,
    });

    const copy = await duplicateBag("b1");

    expect(mocks.rpc).toHaveBeenCalledWith("duplicate_bag", { p_bag_id: "b1" });
    expect(copy).toEqual({ id: "b2", name: "Main (copy)" });
  });

  it("surfaces an RPC error", async () => {
    mocks.rpc.mockResolvedValue({ data: null, error: { message: "bag not found" } });

    await expect(duplicateBag("b1")).rejects.toThrow("bag not found");
  });
});
