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
});
