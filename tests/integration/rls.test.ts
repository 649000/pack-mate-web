import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { publicConfig } from "@/lib/public-config";

const FIREBASE_API_KEY = publicConfig.firebase.apiKey;
const SUPABASE_URL = publicConfig.supabase.url;
const SUPABASE_KEY = publicConfig.supabase.publishableKey;
const SCHEMA = "packmate";

const hasConfig = Boolean(FIREBASE_API_KEY && SUPABASE_URL && SUPABASE_KEY);

type Session = { idToken: string; localId: string };

async function signUp(email: string): Promise<Session> {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "Test-pass-123456", returnSecureToken: true }),
    },
  );
  const json = await res.json();
  if (!res.ok) throw new Error(`signUp failed (${res.status}): ${JSON.stringify(json)}`);
  return { idToken: json.idToken, localId: json.localId };
}

async function deleteUser(idToken: string): Promise<void> {
  await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:delete?key=${FIREBASE_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
}

function headers(token: string, extra: Record<string, string> = {}) {
  return {
    apikey: SUPABASE_KEY as string,
    Authorization: `Bearer ${token}`,
    "Accept-Profile": SCHEMA,
    "Content-Profile": SCHEMA,
    "Content-Type": "application/json",
    Prefer: "return=representation",
    ...extra,
  };
}

async function rest(path: string, token: string, init: RequestInit = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: headers(token, (init.headers as Record<string, string>) ?? {}),
  });
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { status: res.status, body };
}

// Anonymous requests carry only the publishable key and no bearer token.
async function anon(path: string, init: RequestInit = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_KEY as string,
      "Accept-Profile": SCHEMA,
      "Content-Profile": SCHEMA,
      "Content-Type": "application/json",
      ...((init.headers as Record<string, string>) ?? {}),
    },
  });
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { status: res.status, body };
}

describe.skipIf(!hasConfig)("RLS and copy-on-add (integration)", () => {
  const stamp = Date.now();
  let a: Session;
  let b: Session;

  beforeAll(async () => {
    a = await signUp(`packmate-it-a-${stamp}@example.com`);
    b = await signUp(`packmate-it-b-${stamp}@example.com`);
  }, 30_000);

  afterAll(async () => {
    if (a) await deleteUser(a.idToken);
    if (b) await deleteUser(b.idToken);
  }, 30_000);

  it("lets a user create and read their own items", async () => {
    const created = await rest("reusable_items", a.idToken, {
      method: "POST",
      body: JSON.stringify({ name: "Passport", default_qty: 1 }),
    });
    expect(created.status).toBe(201);

    const list = await rest("reusable_items?select=*", a.idToken);
    expect(list.status).toBe(200);
    expect((list.body as unknown[]).length).toBeGreaterThanOrEqual(1);
  });

  it("does not let another user read or update the first user's rows", async () => {
    const created = await rest("reusable_items", a.idToken, {
      method: "POST",
      body: JSON.stringify({ name: "Wallet", default_qty: 1 }),
    });
    const itemId = (created.body as { id: string }[])[0].id;

    const bList = await rest("reusable_items?select=*", b.idToken);
    expect(bList.status).toBe(200);
    expect(bList.body).toEqual([]);

    const bUpdate = await rest(`reusable_items?id=eq.${itemId}`, b.idToken, {
      method: "PATCH",
      body: JSON.stringify({ name: "Hacked" }),
    });
    expect(Array.isArray(bUpdate.body) ? bUpdate.body.length : 0).toBe(0);
  });

  it("rejects a forged owner id", async () => {
    const forge = await rest("reusable_items", b.idToken, {
      method: "POST",
      body: JSON.stringify({ name: "Forged", default_qty: 1, user_id: a.localId }),
    });
    expect(forge.status).toBe(403);
  });

  it("copies library contents into a trip and isolates later library edits", async () => {
    const item = await rest("reusable_items", a.idToken, {
      method: "POST",
      body: JSON.stringify({ name: "Charger", default_qty: 2 }),
    });
    const itemId = (item.body as { id: string }[])[0].id;

    const bag = await rest("reusable_bags", a.idToken, {
      method: "POST",
      body: JSON.stringify({ name: "Electronics" }),
    });
    const bagId = (bag.body as { id: string }[])[0].id;

    await rest("reusable_bag_items", a.idToken, {
      method: "POST",
      body: JSON.stringify({ bag_id: bagId, item_id: itemId, qty: 2, position: 0 }),
    });

    const trip = await rest("trips", a.idToken, {
      method: "POST",
      body: JSON.stringify({ name: "Japan" }),
    });
    const tripId = (trip.body as { id: string }[])[0].id;

    const rpc = await rest("rpc/add_library_bag_to_trip", a.idToken, {
      method: "POST",
      body: JSON.stringify({ p_trip_id: tripId, p_bag_id: bagId }),
    });
    expect([200, 201]).toContain(rpc.status);

    const before = await rest(`trip_entries?trip_id=eq.${tripId}&select=*`, a.idToken);
    const entries = before.body as { name: string; qty: number }[];
    expect(entries).toHaveLength(1);
    expect(entries[0].name).toBe("Charger");
    expect(entries[0].qty).toBe(2);

    await rest(`reusable_items?id=eq.${itemId}`, a.idToken, {
      method: "PATCH",
      body: JSON.stringify({ name: "Renamed Charger" }),
    });

    const after = await rest(`trip_entries?trip_id=eq.${tripId}&select=*`, a.idToken);
    expect((after.body as { name: string }[])[0].name).toBe("Charger");
  }, 30_000);

  it("enforces location exclusivity, persists quantity and order, and cascades on trip delete", async () => {
    const item = await rest("reusable_items", a.idToken, {
      method: "POST",
      body: JSON.stringify({ name: "Socks", default_qty: 1 }),
    });
    const itemId = (item.body as { id: string }[])[0].id;

    const trip = await rest("trips", a.idToken, {
      method: "POST",
      body: JSON.stringify({ name: "Cascade" }),
    });
    const tripId = (trip.body as { id: string }[])[0].id;

    const bag = await rest("reusable_bags", a.idToken, {
      method: "POST",
      body: JSON.stringify({ name: "Daypack" }),
    });
    const bagId = (bag.body as { id: string }[])[0].id;

    await rest("reusable_bag_items", a.idToken, {
      method: "POST",
      body: JSON.stringify({ bag_id: bagId, item_id: itemId, qty: 1, position: 0 }),
    });
    await rest("rpc/add_library_bag_to_trip", a.idToken, {
      method: "POST",
      body: JSON.stringify({ p_trip_id: tripId, p_bag_id: bagId }),
    });

    const entries = await rest(`trip_entries?trip_id=eq.${tripId}&select=*`, a.idToken);
    const entryId = (entries.body as { id: string }[])[0].id;

    // Quantity persists.
    await rest(`trip_entries?id=eq.${entryId}`, a.idToken, {
      method: "PATCH",
      body: JSON.stringify({ qty: 3 }),
    });
    const qty = await rest(`trip_entries?id=eq.${entryId}&select=qty`, a.idToken);
    expect((qty.body as { qty: number }[])[0].qty).toBe(3);

    // Bag membership and With Me are mutually exclusive.
    const conflict = await rest(`trip_entries?id=eq.${entryId}`, a.idToken, {
      method: "PATCH",
      body: JSON.stringify({ is_with_me: true }),
    });
    expect(conflict.status).toBeGreaterThanOrEqual(400);

    // Order persists.
    const loose = await rest("trip_entries", a.idToken, {
      method: "POST",
      body: JSON.stringify({ trip_id: tripId, name: "Adapter", qty: 1, position: 1 }),
    });
    const looseId = (loose.body as { id: string }[])[0].id;
    await rest(`trip_entries?id=eq.${entryId}`, a.idToken, {
      method: "PATCH",
      body: JSON.stringify({ position: 1 }),
    });
    await rest(`trip_entries?id=eq.${looseId}`, a.idToken, {
      method: "PATCH",
      body: JSON.stringify({ position: 0 }),
    });
    const ordered = await rest(
      `trip_entries?trip_id=eq.${tripId}&select=id&order=position.asc`,
      a.idToken,
    );
    expect((ordered.body as { id: string }[])[0].id).toBe(looseId);

    // Deleting the trip removes its packing list.
    await rest(`trips?id=eq.${tripId}`, a.idToken, { method: "DELETE" });
    const remaining = await rest(`trip_entries?trip_id=eq.${tripId}&select=id`, a.idToken);
    expect(remaining.body).toEqual([]);
  }, 30_000);

  it("scopes profiles to the owner", async () => {
    const created = await rest("profiles", a.idToken, {
      method: "POST",
      body: JSON.stringify({ display_name: "Ada", gender: "female" }),
    });
    expect(created.status).toBe(201);
    expect((created.body as { user_id: string }[])[0].user_id).toBe(a.localId);

    const own = await rest("profiles?select=*", a.idToken);
    expect(own.status).toBe(200);
    expect((own.body as unknown[]).length).toBe(1);

    const bList = await rest("profiles?select=*", b.idToken);
    expect(bList.body).toEqual([]);

    const bUpdate = await rest(`profiles?user_id=eq.${a.localId}`, b.idToken, {
      method: "PATCH",
      body: JSON.stringify({ display_name: "Hacked" }),
    });
    expect(Array.isArray(bUpdate.body) ? bUpdate.body.length : 0).toBe(0);

    const forge = await rest("profiles", b.idToken, {
      method: "POST",
      body: JSON.stringify({ user_id: a.localId, display_name: "Forged" }),
    });
    expect(forge.status).toBe(403);

    await rest(`profiles?user_id=eq.${a.localId}`, a.idToken, { method: "DELETE" });
  }, 30_000);

  it("copies item details onto a trip entry and keeps them trip-scoped", async () => {
    const item = await rest("reusable_items", a.idToken, {
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

    const trip = await rest("trips", a.idToken, {
      method: "POST",
      body: JSON.stringify({ name: "Details" }),
    });
    const tripId = (trip.body as { id: string }[])[0].id;

    const rpc = await rest("rpc/add_library_item_to_trip", a.idToken, {
      method: "POST",
      body: JSON.stringify({ p_trip_id: tripId, p_item_id: itemId }),
    });
    expect([200, 201]).toContain(rpc.status);

    const entries = await rest(`trip_entries?trip_id=eq.${tripId}&select=*`, a.idToken);
    const entry = (
      entries.body as { id: string; description: string; link: string; image_url: string }[]
    )[0];
    expect(entry.description).toBe("USB-C, 65W");
    expect(entry.link).toBe("https://example.com/charger");
    expect(entry.image_url).toBe("https://example.com/charger.jpg");

    // Editing the trip entry does not change the library item.
    await rest(`trip_entries?id=eq.${entry.id}`, a.idToken, {
      method: "PATCH",
      body: JSON.stringify({ description: "Trip only" }),
    });
    const library = await rest(`reusable_items?id=eq.${itemId}&select=description`, a.idToken);
    expect((library.body as { description: string }[])[0].description).toBe("USB-C, 65W");

    // A second user cannot read the first user's details.
    const bEntries = await rest(`trip_entries?trip_id=eq.${tripId}&select=*`, b.idToken);
    expect(bEntries.body).toEqual([]);
    const bItems = await rest(`reusable_items?id=eq.${itemId}&select=*`, b.idToken);
    expect(bItems.body).toEqual([]);
  }, 30_000);

  it("rejects a non-http link or image URL", async () => {
    const badLink = await rest("reusable_items", a.idToken, {
      method: "POST",
      body: JSON.stringify({ name: "Bad link", default_qty: 1, link: "javascript:alert(1)" }),
    });
    expect(badLink.status).toBeGreaterThanOrEqual(400);

    const badImage = await rest("reusable_items", a.idToken, {
      method: "POST",
      body: JSON.stringify({ name: "Bad image", default_qty: 1, image_url: "not-a-url" }),
    });
    expect(badImage.status).toBeGreaterThanOrEqual(400);
  }, 30_000);

  it("copies weight and a bag limit onto a trip and keeps them scoped", async () => {
    const item = await rest("reusable_items", a.idToken, {
      method: "POST",
      body: JSON.stringify({ name: "Tent", default_qty: 1, weight_grams: 1200 }),
    });
    const itemId = (item.body as { id: string }[])[0].id;

    const bag = await rest("reusable_bags", a.idToken, {
      method: "POST",
      body: JSON.stringify({ name: "Main", weight_limit_grams: 23000 }),
    });
    const bagId = (bag.body as { id: string }[])[0].id;

    await rest("reusable_bag_items", a.idToken, {
      method: "POST",
      body: JSON.stringify({ bag_id: bagId, item_id: itemId, qty: 1, position: 0 }),
    });

    const trip = await rest("trips", a.idToken, {
      method: "POST",
      body: JSON.stringify({ name: "Weight" }),
    });
    const tripId = (trip.body as { id: string }[])[0].id;

    const rpc = await rest("rpc/add_library_bag_to_trip", a.idToken, {
      method: "POST",
      body: JSON.stringify({ p_trip_id: tripId, p_bag_id: bagId }),
    });
    expect([200, 201]).toContain(rpc.status);

    const bags = await rest(`trip_bags?trip_id=eq.${tripId}&select=*`, a.idToken);
    expect((bags.body as { weight_limit_grams: number }[])[0].weight_limit_grams).toBe(23000);

    const entries = await rest(`trip_entries?trip_id=eq.${tripId}&select=*`, a.idToken);
    expect((entries.body as { weight_grams: number }[])[0].weight_grams).toBe(1200);

    // A second user cannot read the weight or limit.
    const bBags = await rest(`trip_bags?trip_id=eq.${tripId}&select=*`, b.idToken);
    expect(bBags.body).toEqual([]);
    const bEntries = await rest(`trip_entries?trip_id=eq.${tripId}&select=*`, b.idToken);
    expect(bEntries.body).toEqual([]);
  }, 30_000);

  it("rejects a negative weight or limit and an unknown weight unit", async () => {
    const badWeight = await rest("reusable_items", a.idToken, {
      method: "POST",
      body: JSON.stringify({ name: "Bad weight", default_qty: 1, weight_grams: -1 }),
    });
    expect(badWeight.status).toBeGreaterThanOrEqual(400);

    const badLimit = await rest("reusable_bags", a.idToken, {
      method: "POST",
      body: JSON.stringify({ name: "Bad limit", weight_limit_grams: -1 }),
    });
    expect(badLimit.status).toBeGreaterThanOrEqual(400);

    const created = await rest("profiles", a.idToken, {
      method: "POST",
      body: JSON.stringify({ display_name: "Ada" }),
    });
    expect(created.status).toBe(201);
    expect((created.body as { weight_unit: string }[])[0].weight_unit).toBe("kg");

    const badUnit = await rest(`profiles?user_id=eq.${a.localId}`, a.idToken, {
      method: "PATCH",
      body: JSON.stringify({ weight_unit: "stone" }),
    });
    expect(badUnit.status).toBeGreaterThanOrEqual(400);

    await rest(`profiles?user_id=eq.${a.localId}`, a.idToken, { method: "DELETE" });
  }, 30_000);

  it("copies item categories into a trip and keeps them scoped", async () => {
    const item = await rest("reusable_items", a.idToken, {
      method: "POST",
      body: JSON.stringify({ name: "Tee", default_qty: 1, category: "clothing" }),
    });
    expect(item.status).toBe(201);
    const itemId = (item.body as { id: string }[])[0].id;

    const bag = await rest("reusable_bags", a.idToken, {
      method: "POST",
      body: JSON.stringify({ name: "Clothes" }),
    });
    const bagId = (bag.body as { id: string }[])[0].id;
    await rest("reusable_bag_items", a.idToken, {
      method: "POST",
      body: JSON.stringify({ bag_id: bagId, item_id: itemId, qty: 1, position: 0 }),
    });

    const trip = await rest("trips", a.idToken, {
      method: "POST",
      body: JSON.stringify({ name: "Categories" }),
    });
    const tripId = (trip.body as { id: string }[])[0].id;

    // Adding the item directly copies its category.
    const direct = await rest("rpc/add_library_item_to_trip", a.idToken, {
      method: "POST",
      body: JSON.stringify({ p_trip_id: tripId, p_item_id: itemId }),
    });
    expect([200, 201]).toContain(direct.status);

    // Adding a bag copies the category of its default contents.
    const bagged = await rest("rpc/add_library_bag_to_trip", a.idToken, {
      method: "POST",
      body: JSON.stringify({ p_trip_id: tripId, p_bag_id: bagId }),
    });
    expect([200, 201]).toContain(bagged.status);

    const entries = await rest(`trip_entries?trip_id=eq.${tripId}&select=category`, a.idToken);
    const categories = (entries.body as { category: string | null }[]).map((row) => row.category);
    expect(categories).toHaveLength(2);
    expect(categories).toEqual(["clothing", "clothing"]);

    // A second user cannot read the categorised rows.
    const bItems = await rest(`reusable_items?id=eq.${itemId}&select=*`, b.idToken);
    expect(bItems.body).toEqual([]);
    const bEntries = await rest(`trip_entries?trip_id=eq.${tripId}&select=*`, b.idToken);
    expect(bEntries.body).toEqual([]);
  }, 30_000);

  it("rejects a category outside the fixed set", async () => {
    const bad = await rest("reusable_items", a.idToken, {
      method: "POST",
      body: JSON.stringify({ name: "Bad category", default_qty: 1, category: "unknown" }),
    });
    expect(bad.status).toBeGreaterThanOrEqual(400);
  }, 30_000);

  it("nests bags within a trip, rejects cycles and cross-trip parents, and stays scoped", async () => {
    const tripA = await rest("trips", a.idToken, {
      method: "POST",
      body: JSON.stringify({ name: "Nest A" }),
    });
    const tripAId = (tripA.body as { id: string }[])[0].id;
    const tripB = await rest("trips", a.idToken, {
      method: "POST",
      body: JSON.stringify({ name: "Nest B" }),
    });
    const tripBId = (tripB.body as { id: string }[])[0].id;

    const outer = await rest("trip_bags", a.idToken, {
      method: "POST",
      body: JSON.stringify({ trip_id: tripAId, name: "Outer", position: 0 }),
    });
    const outerId = (outer.body as { id: string }[])[0].id;
    const inner = await rest("trip_bags", a.idToken, {
      method: "POST",
      body: JSON.stringify({ trip_id: tripAId, name: "Inner", position: 1 }),
    });
    const innerId = (inner.body as { id: string }[])[0].id;
    const other = await rest("trip_bags", a.idToken, {
      method: "POST",
      body: JSON.stringify({ trip_id: tripBId, name: "Other", position: 0 }),
    });
    const otherId = (other.body as { id: string }[])[0].id;

    // Valid nesting.
    const nested = await rest(`trip_bags?id=eq.${innerId}`, a.idToken, {
      method: "PATCH",
      body: JSON.stringify({ parent_bag_id: outerId }),
    });
    expect(nested.status).toBeLessThan(300);
    const readBack = await rest(`trip_bags?id=eq.${innerId}&select=parent_bag_id`, a.idToken);
    expect((readBack.body as { parent_bag_id: string }[])[0].parent_bag_id).toBe(outerId);

    // A bag cannot contain itself.
    const selfParent = await rest(`trip_bags?id=eq.${outerId}`, a.idToken, {
      method: "PATCH",
      body: JSON.stringify({ parent_bag_id: outerId }),
    });
    expect(selfParent.status).toBeGreaterThanOrEqual(400);

    // A bag cannot contain its own descendant.
    const cycle = await rest(`trip_bags?id=eq.${outerId}`, a.idToken, {
      method: "PATCH",
      body: JSON.stringify({ parent_bag_id: innerId }),
    });
    expect(cycle.status).toBeGreaterThanOrEqual(400);

    // A parent must belong to the same trip.
    const crossTrip = await rest(`trip_bags?id=eq.${outerId}`, a.idToken, {
      method: "PATCH",
      body: JSON.stringify({ parent_bag_id: otherId }),
    });
    expect(crossTrip.status).toBeGreaterThanOrEqual(400);

    // A second user cannot read the nested bags.
    const bBags = await rest(`trip_bags?trip_id=eq.${tripAId}&select=*`, b.idToken);
    expect(bBags.body).toEqual([]);
  }, 30_000);

  it("does not let an anonymous client read share-link tables", async () => {
    const links = await anon("share_links?select=id");
    expect(links.status).toBeGreaterThanOrEqual(400);

    const trips = await anon("trips?select=id");
    expect(trips.status).toBeGreaterThanOrEqual(400);

    const entries = await anon("trip_entries?select=id");
    expect(entries.status).toBeGreaterThanOrEqual(400);
  }, 30_000);

  it("serves a shared trip only for a valid active token", async () => {
    const trip = await rest("trips", a.idToken, {
      method: "POST",
      body: JSON.stringify({ name: "Shared" }),
    });
    const tripId = (trip.body as { id: string }[])[0].id;

    const entry = await rest("trip_entries", a.idToken, {
      method: "POST",
      body: JSON.stringify({
        trip_id: tripId,
        name: "Passport",
        qty: 1,
        position: 0,
        category: "documents",
      }),
    });
    expect(entry.status).toBe(201);

    const created = await rest("share_links", a.idToken, {
      method: "POST",
      body: JSON.stringify({ trip_id: tripId }),
    });
    expect(created.status).toBe(201);
    const link = (created.body as { id: string; token: string }[])[0];
    expect(link.token).toHaveLength(64);

    // An anonymous visitor with the token sees the projection.
    const shared = await anon("rpc/get_shared_trip", {
      method: "POST",
      body: JSON.stringify({ p_token: link.token }),
    });
    expect(shared.status).toBe(200);
    const payload = shared.body as {
      v: number;
      trip: { name: string };
      bags: unknown[];
      entries: { name: string; category: string | null }[];
    };
    expect(payload.v).toBe(2);
    expect(payload.trip.name).toBe("Shared");
    expect(payload.entries[0].name).toBe("Passport");
    expect(payload.entries[0].category).toBe("documents");

    // The projection never carries owner or library identifiers.
    const serialised = JSON.stringify(payload);
    expect(serialised).not.toContain(a.localId);
    expect(serialised).not.toContain("user_id");
    expect(serialised).not.toContain("source_item_id");
    expect(serialised).not.toContain("source_bag_id");

    // An unknown token resolves to nothing.
    const unknown = await anon("rpc/get_shared_trip", {
      method: "POST",
      body: JSON.stringify({ p_token: "0".repeat(64) }),
    });
    expect(unknown.status).toBe(200);
    expect(unknown.body).toBeNull();

    // Revoking stops access immediately.
    await rest(`share_links?id=eq.${link.id}`, a.idToken, {
      method: "PATCH",
      body: JSON.stringify({ revoked_at: new Date().toISOString() }),
    });
    const afterRevoke = await anon("rpc/get_shared_trip", {
      method: "POST",
      body: JSON.stringify({ p_token: link.token }),
    });
    expect(afterRevoke.body).toBeNull();

    // Deleting the trip removes the link.
    await rest(`trips?id=eq.${tripId}`, a.idToken, { method: "DELETE" });
    const afterDelete = await anon("rpc/get_shared_trip", {
      method: "POST",
      body: JSON.stringify({ p_token: link.token }),
    });
    expect(afterDelete.body).toBeNull();
  }, 30_000);

  it("keeps share links scoped to the owner", async () => {
    const trip = await rest("trips", a.idToken, {
      method: "POST",
      body: JSON.stringify({ name: "Private" }),
    });
    const tripId = (trip.body as { id: string }[])[0].id;

    const created = await rest("share_links", a.idToken, {
      method: "POST",
      body: JSON.stringify({ trip_id: tripId }),
    });
    const linkId = (created.body as { id: string }[])[0].id;

    // A second user sees nothing and cannot revoke the link.
    const bList = await rest("share_links?select=*", b.idToken);
    expect(bList.body).toEqual([]);

    const bRevoke = await rest(`share_links?id=eq.${linkId}`, b.idToken, {
      method: "PATCH",
      body: JSON.stringify({ revoked_at: new Date().toISOString() }),
    });
    expect(Array.isArray(bRevoke.body) ? bRevoke.body.length : 0).toBe(0);

    const bDelete = await rest(`share_links?id=eq.${linkId}`, b.idToken, { method: "DELETE" });
    expect(Array.isArray(bDelete.body) ? bDelete.body.length : 0).toBe(0);

    // The owner's link is still active.
    const own = await rest(`share_links?id=eq.${linkId}&select=revoked_at`, a.idToken);
    expect((own.body as { revoked_at: string | null }[])[0].revoked_at).toBeNull();
  }, 30_000);

  it("rejects a share link for a trip the user does not own", async () => {
    const trip = await rest("trips", a.idToken, {
      method: "POST",
      body: JSON.stringify({ name: "Not yours" }),
    });
    const tripId = (trip.body as { id: string }[])[0].id;

    const forge = await rest("share_links", b.idToken, {
      method: "POST",
      body: JSON.stringify({ trip_id: tripId }),
    });
    expect(forge.status).toBe(403);
  }, 30_000);
});
