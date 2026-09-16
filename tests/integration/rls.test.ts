import { beforeAll, describe, expect, it } from "vitest";
import { SUPABASE_URL, mintToken, rest } from "./helpers";

const stamp = Date.now();
const userA = `it-a-${stamp}`;
const userB = `it-b-${stamp}`;
const tokenA = mintToken(userA);
const tokenB = mintToken(userB);

describe("RLS and copy-on-add (integration)", () => {
  beforeAll(async () => {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/`);
    } catch {
      throw new Error(
        `Local Supabase is not reachable at ${SUPABASE_URL}. Run "npm run supabase:start" first.`,
      );
    }
  }, 30_000);

  it("lets a user create and read their own items", async () => {
    const created = await rest("reusable_items", tokenA, {
      method: "POST",
      body: JSON.stringify({ name: "Passport", default_qty: 1 }),
    });
    expect(created.status).toBe(201);

    const list = await rest("reusable_items?select=*", tokenA);
    expect(list.status).toBe(200);
    expect((list.body as unknown[]).length).toBeGreaterThanOrEqual(1);
  });

  it("does not let another user read or update the first user's rows", async () => {
    const created = await rest("reusable_items", tokenA, {
      method: "POST",
      body: JSON.stringify({ name: "Wallet", default_qty: 1 }),
    });
    const itemId = (created.body as { id: string }[])[0].id;

    const bList = await rest("reusable_items?select=*", tokenB);
    expect(bList.status).toBe(200);
    expect(bList.body).toEqual([]);

    const bUpdate = await rest(`reusable_items?id=eq.${itemId}`, tokenB, {
      method: "PATCH",
      body: JSON.stringify({ name: "Hacked" }),
    });
    expect(Array.isArray(bUpdate.body) ? bUpdate.body.length : 0).toBe(0);
  });

  it("rejects a forged owner id", async () => {
    const forge = await rest("reusable_items", tokenB, {
      method: "POST",
      body: JSON.stringify({ name: "Forged", default_qty: 1, user_id: userA }),
    });
    expect(forge.status).toBe(403);
  });

  it("returns no rows for an unauthenticated request", async () => {
    const list = await rest("reusable_items?select=*", null);
    expect(list.status).toBeGreaterThanOrEqual(400);
    expect(Array.isArray(list.body) ? list.body.length : 0).toBe(0);
  });

  it("copies library contents into a trip and isolates later library edits", async () => {
    const item = await rest("reusable_items", tokenA, {
      method: "POST",
      body: JSON.stringify({ name: "Charger", default_qty: 2 }),
    });
    const itemId = (item.body as { id: string }[])[0].id;

    const bag = await rest("reusable_bags", tokenA, {
      method: "POST",
      body: JSON.stringify({ name: "Electronics" }),
    });
    const bagId = (bag.body as { id: string }[])[0].id;

    await rest("reusable_bag_items", tokenA, {
      method: "POST",
      body: JSON.stringify({ bag_id: bagId, item_id: itemId, qty: 2, position: 0 }),
    });

    const trip = await rest("trips", tokenA, {
      method: "POST",
      body: JSON.stringify({ name: "Japan" }),
    });
    const tripId = (trip.body as { id: string }[])[0].id;

    const rpc = await rest("rpc/add_library_bag_to_trip", tokenA, {
      method: "POST",
      body: JSON.stringify({ p_trip_id: tripId, p_bag_id: bagId }),
    });
    expect([200, 201]).toContain(rpc.status);

    const before = await rest(`trip_entries?trip_id=eq.${tripId}&select=*`, tokenA);
    const entries = before.body as { name: string; qty: number }[];
    expect(entries).toHaveLength(1);
    expect(entries[0].name).toBe("Charger");
    expect(entries[0].qty).toBe(2);

    await rest(`reusable_items?id=eq.${itemId}`, tokenA, {
      method: "PATCH",
      body: JSON.stringify({ name: "Renamed Charger" }),
    });

    const after = await rest(`trip_entries?trip_id=eq.${tripId}&select=*`, tokenA);
    expect((after.body as { name: string }[])[0].name).toBe("Charger");
  }, 30_000);

  it("enforces location exclusivity, persists quantity and order, and cascades on trip delete", async () => {
    const item = await rest("reusable_items", tokenA, {
      method: "POST",
      body: JSON.stringify({ name: "Socks", default_qty: 1 }),
    });
    const itemId = (item.body as { id: string }[])[0].id;

    const trip = await rest("trips", tokenA, {
      method: "POST",
      body: JSON.stringify({ name: "Cascade" }),
    });
    const tripId = (trip.body as { id: string }[])[0].id;

    const bag = await rest("reusable_bags", tokenA, {
      method: "POST",
      body: JSON.stringify({ name: "Daypack" }),
    });
    const bagId = (bag.body as { id: string }[])[0].id;

    await rest("reusable_bag_items", tokenA, {
      method: "POST",
      body: JSON.stringify({ bag_id: bagId, item_id: itemId, qty: 1, position: 0 }),
    });
    await rest("rpc/add_library_bag_to_trip", tokenA, {
      method: "POST",
      body: JSON.stringify({ p_trip_id: tripId, p_bag_id: bagId }),
    });

    const entries = await rest(`trip_entries?trip_id=eq.${tripId}&select=*`, tokenA);
    const entryId = (entries.body as { id: string }[])[0].id;

    // Quantity persists.
    await rest(`trip_entries?id=eq.${entryId}`, tokenA, {
      method: "PATCH",
      body: JSON.stringify({ qty: 3 }),
    });
    const qty = await rest(`trip_entries?id=eq.${entryId}&select=qty`, tokenA);
    expect((qty.body as { qty: number }[])[0].qty).toBe(3);

    // Bag membership and With Me are mutually exclusive.
    const conflict = await rest(`trip_entries?id=eq.${entryId}`, tokenA, {
      method: "PATCH",
      body: JSON.stringify({ is_with_me: true }),
    });
    expect(conflict.status).toBeGreaterThanOrEqual(400);

    // Order persists.
    const loose = await rest("trip_entries", tokenA, {
      method: "POST",
      body: JSON.stringify({ trip_id: tripId, name: "Adapter", qty: 1, position: 1 }),
    });
    const looseId = (loose.body as { id: string }[])[0].id;
    await rest(`trip_entries?id=eq.${entryId}`, tokenA, {
      method: "PATCH",
      body: JSON.stringify({ position: 1 }),
    });
    await rest(`trip_entries?id=eq.${looseId}`, tokenA, {
      method: "PATCH",
      body: JSON.stringify({ position: 0 }),
    });
    const ordered = await rest(
      `trip_entries?trip_id=eq.${tripId}&select=id&order=position.asc`,
      tokenA,
    );
    expect((ordered.body as { id: string }[])[0].id).toBe(looseId);

    // Deleting the trip removes its packing list.
    await rest(`trips?id=eq.${tripId}`, tokenA, { method: "DELETE" });
    const remaining = await rest(`trip_entries?trip_id=eq.${tripId}&select=id`, tokenA);
    expect(remaining.body).toEqual([]);
  }, 30_000);

  it("scopes profiles to the owner", async () => {
    const created = await rest("profiles", tokenA, {
      method: "POST",
      body: JSON.stringify({ display_name: "Ada", gender: "female" }),
    });
    expect(created.status).toBe(201);
    expect((created.body as { user_id: string }[])[0].user_id).toBe(userA);

    const own = await rest("profiles?select=*", tokenA);
    expect(own.status).toBe(200);
    expect((own.body as unknown[]).length).toBe(1);

    const bList = await rest("profiles?select=*", tokenB);
    expect(bList.body).toEqual([]);

    const bUpdate = await rest(`profiles?user_id=eq.${userA}`, tokenB, {
      method: "PATCH",
      body: JSON.stringify({ display_name: "Hacked" }),
    });
    expect(Array.isArray(bUpdate.body) ? bUpdate.body.length : 0).toBe(0);

    const forge = await rest("profiles", tokenB, {
      method: "POST",
      body: JSON.stringify({ user_id: userA, display_name: "Forged" }),
    });
    expect(forge.status).toBe(403);

    await rest(`profiles?user_id=eq.${userA}`, tokenA, { method: "DELETE" });
  }, 30_000);

  it("copies item details onto a trip entry and keeps them trip-scoped", async () => {
    const item = await rest("reusable_items", tokenA, {
      method: "POST",
      body: JSON.stringify({
        name: "Charger",
        default_qty: 1,
        description: "USB-C, 65W",
        link: "https://example.com/charger",
        image_url: "https://example.com/charger.jpg",
      }),
    });
    const itemId = (item.body as { id: string }[])[0].id;

    const trip = await rest("trips", tokenA, {
      method: "POST",
      body: JSON.stringify({ name: "Details" }),
    });
    const tripId = (trip.body as { id: string }[])[0].id;

    const rpc = await rest("rpc/add_library_item_to_trip", tokenA, {
      method: "POST",
      body: JSON.stringify({ p_trip_id: tripId, p_item_id: itemId }),
    });
    expect([200, 201]).toContain(rpc.status);

    const entries = await rest(`trip_entries?trip_id=eq.${tripId}&select=*`, tokenA);
    const entry = (
      entries.body as { id: string; description: string; link: string; image_url: string }[]
    )[0];
    expect(entry.description).toBe("USB-C, 65W");
    expect(entry.link).toBe("https://example.com/charger");
    expect(entry.image_url).toBe("https://example.com/charger.jpg");

    // Editing the trip entry does not change the library item.
    await rest(`trip_entries?id=eq.${entry.id}`, tokenA, {
      method: "PATCH",
      body: JSON.stringify({ description: "Trip only" }),
    });
    const library = await rest(`reusable_items?id=eq.${itemId}&select=description`, tokenA);
    expect((library.body as { description: string }[])[0].description).toBe("USB-C, 65W");

    // A second user cannot read the first user's details.
    const bEntries = await rest(`trip_entries?trip_id=eq.${tripId}&select=*`, tokenB);
    expect(bEntries.body).toEqual([]);
    const bItems = await rest(`reusable_items?id=eq.${itemId}&select=*`, tokenB);
    expect(bItems.body).toEqual([]);
  }, 30_000);

  it("rejects a non-http link or image URL", async () => {
    const badLink = await rest("reusable_items", tokenA, {
      method: "POST",
      body: JSON.stringify({ name: "Bad link", default_qty: 1, link: "javascript:alert(1)" }),
    });
    expect(badLink.status).toBeGreaterThanOrEqual(400);

    const badImage = await rest("reusable_items", tokenA, {
      method: "POST",
      body: JSON.stringify({ name: "Bad image", default_qty: 1, image_url: "not-a-url" }),
    });
    expect(badImage.status).toBeGreaterThanOrEqual(400);
  }, 30_000);
});
