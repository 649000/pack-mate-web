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
      body: JSON.stringify({ name: "Japan", country_code: "JP" }),
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
      body: JSON.stringify({ name: "Cascade", country_code: "JP" }),
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
      body: JSON.stringify({ name: "Details", country_code: "JP" }),
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

  it("duplicates a trip's packing list and rejects another user", async () => {
    const trip = await rest("trips", tokenA, {
      method: "POST",
      body: JSON.stringify({
        name: "Japan",
        country_code: "JP",
        destination: "Tokyo",
        start_date: "2026-03-01",
        end_date: "2026-03-10",
      }),
    });
    const tripId = (trip.body as { id: string }[])[0].id;

    const suitcase = await rest("trip_bags", tokenA, {
      method: "POST",
      body: JSON.stringify({ trip_id: tripId, name: "Suitcase", position: 0 }),
    });
    const suitcaseId = (suitcase.body as { id: string }[])[0].id;

    const toiletry = await rest("trip_bags", tokenA, {
      method: "POST",
      body: JSON.stringify({
        trip_id: tripId,
        name: "Toiletry",
        position: 1,
        parent_bag_id: suitcaseId,
      }),
    });
    const toiletryId = (toiletry.body as { id: string }[])[0].id;

    await rest("trip_entries", tokenA, {
      method: "POST",
      body: JSON.stringify({
        trip_id: tripId,
        trip_bag_id: toiletryId,
        name: "Toothbrush",
        qty: 2,
        is_packed: true,
        position: 0,
        description: "Blue",
        category: "toiletries",
      }),
    });
    await rest("trip_entries", tokenA, {
      method: "POST",
      body: JSON.stringify({
        trip_id: tripId,
        name: "Passport",
        qty: 1,
        is_with_me: true,
        is_packed: true,
        position: 1,
      }),
    });

    const dup = await rest("rpc/duplicate_trip", tokenA, {
      method: "POST",
      body: JSON.stringify({
        p_source_trip_id: tripId,
        p_name: "Japan 2027",
        p_country_code: "JP",
        p_destination: "Osaka",
        p_start_date: null,
        p_end_date: null,
      }),
    });
    expect([200, 201]).toContain(dup.status);
    const newTripId = dup.body as string;

    const newTrip = await rest(`trips?id=eq.${newTripId}&select=*`, tokenA);
    const newTripRow = (
      newTrip.body as {
        name: string;
        destination: string;
        country_code: string;
        start_date: string | null;
        end_date: string | null;
      }[]
    )[0];
    expect(newTripRow.name).toBe("Japan 2027");
    expect(newTripRow.destination).toBe("Osaka");
    expect(newTripRow.country_code).toBe("JP");
    expect(newTripRow.start_date).toBeNull();
    expect(newTripRow.end_date).toBeNull();

    const newBags = await rest(
      `trip_bags?trip_id=eq.${newTripId}&select=id,name,parent_bag_id&order=position.asc`,
      tokenA,
    );
    const bagRows = newBags.body as { id: string; name: string; parent_bag_id: string | null }[];
    const newSuitcase = bagRows.find((row) => row.name === "Suitcase")!;
    const newToiletry = bagRows.find((row) => row.name === "Toiletry")!;
    expect(newToiletry.parent_bag_id).toBe(newSuitcase.id);
    expect(newToiletry.id).not.toBe(toiletryId);

    const newEntries = await rest(
      `trip_entries?trip_id=eq.${newTripId}&select=name,qty,is_packed,is_with_me,trip_bag_id,description,category&order=position.asc`,
      tokenA,
    );
    const entryRows = newEntries.body as {
      name: string;
      qty: number;
      is_packed: boolean;
      is_with_me: boolean;
      trip_bag_id: string | null;
      description: string | null;
      category: string | null;
    }[];
    const toothbrush = entryRows.find((row) => row.name === "Toothbrush")!;
    expect(toothbrush.is_packed).toBe(false);
    expect(toothbrush.qty).toBe(2);
    expect(toothbrush.description).toBe("Blue");
    expect(toothbrush.category).toBe("toiletries");
    expect(toothbrush.trip_bag_id).toBe(newToiletry.id);
    const passport = entryRows.find((row) => row.name === "Passport")!;
    expect(passport.is_packed).toBe(false);
    expect(passport.is_with_me).toBe(true);

    // The source trip is untouched.
    const sourceEntries = await rest(`trip_entries?trip_id=eq.${tripId}&select=is_packed`, tokenA);
    expect((sourceEntries.body as { is_packed: boolean }[]).every((row) => row.is_packed)).toBe(
      true,
    );

    // A second user can neither duplicate the trip nor read the copy.
    const bDup = await rest("rpc/duplicate_trip", tokenB, {
      method: "POST",
      body: JSON.stringify({
        p_source_trip_id: tripId,
        p_name: "Hacked",
        p_country_code: "JP",
        p_destination: null,
        p_start_date: null,
        p_end_date: null,
      }),
    });
    expect(bDup.status).toBeGreaterThanOrEqual(400);

    const bCopy = await rest(`trips?id=eq.${newTripId}&select=id`, tokenB);
    expect(bCopy.body).toEqual([]);
  }, 30_000);

  it("bulk-changes packed state for the owner only", async () => {
    const trip = await rest("trips", tokenA, {
      method: "POST",
      body: JSON.stringify({ name: "Bulk", country_code: "JP" }),
    });
    const tripId = (trip.body as { id: string }[])[0].id;

    for (const [name, qty] of [
      ["Sock", 1],
      ["Tee", 2],
    ] as const) {
      await rest("trip_entries", tokenA, {
        method: "POST",
        body: JSON.stringify({ trip_id: tripId, name, qty, position: qty }),
      });
    }

    const pack = await rest("rpc/set_trip_packed", tokenA, {
      method: "POST",
      body: JSON.stringify({ p_trip_id: tripId, p_packed: true }),
    });
    expect([200, 204]).toContain(pack.status);

    const packed = await rest(
      `trip_entries?trip_id=eq.${tripId}&select=is_packed,qty&order=position.asc`,
      tokenA,
    );
    const packedRows = packed.body as { is_packed: boolean; qty: number }[];
    expect(packedRows.every((row) => row.is_packed)).toBe(true);
    // Only packed state changes; quantity is untouched.
    expect(packedRows.map((row) => row.qty)).toEqual([1, 2]);

    const unpack = await rest("rpc/set_trip_packed", tokenA, {
      method: "POST",
      body: JSON.stringify({ p_trip_id: tripId, p_packed: false }),
    });
    expect([200, 204]).toContain(unpack.status);

    const unpacked = await rest(`trip_entries?trip_id=eq.${tripId}&select=is_packed`, tokenA);
    expect((unpacked.body as { is_packed: boolean }[]).every((row) => !row.is_packed)).toBe(true);

    // A second user cannot bulk-change the trip.
    const bPack = await rest("rpc/set_trip_packed", tokenB, {
      method: "POST",
      body: JSON.stringify({ p_trip_id: tripId, p_packed: true }),
    });
    expect(bPack.status).toBeGreaterThanOrEqual(400);

    const stillUnpacked = await rest(`trip_entries?trip_id=eq.${tripId}&select=is_packed`, tokenA);
    expect((stillUnpacked.body as { is_packed: boolean }[]).every((row) => !row.is_packed)).toBe(
      true,
    );
  }, 30_000);
});
