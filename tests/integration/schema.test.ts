import { describe, expect, it } from "vitest";
import { mintToken, rest, withDb } from "./helpers";

// Tables the integration suite depends on. Migrations may add more; these must
// always exist and be protected by row-level security.
const REQUIRED_TABLES = [
  "reusable_items",
  "reusable_bags",
  "reusable_bag_items",
  "trips",
  "trip_bags",
  "trip_entries",
  "profiles",
];

describe("schema and RLS policies (integration)", () => {
  it("contains the required tables", async () => {
    const tables = await withDb(async (client) => {
      const result = await client.query<{ tablename: string }>(
        "select tablename from pg_tables where schemaname = 'packmate'",
      );
      return result.rows.map((row) => row.tablename);
    });

    for (const table of REQUIRED_TABLES) {
      expect(tables).toContain(table);
    }
  });

  it("enables row level security on every table", async () => {
    const unprotected = await withDb(async (client) => {
      const result = await client.query<{ tablename: string; rowsecurity: boolean }>(
        "select tablename, rowsecurity from pg_tables where schemaname = 'packmate'",
      );
      return result.rows.filter((row) => !row.rowsecurity).map((row) => row.tablename);
    });

    expect(unprotected).toEqual([]);
  });

  it("defines at least one policy on every table", async () => {
    const withoutPolicy = await withDb(async (client) => {
      const result = await client.query<{ tablename: string; policies: string }>(
        `select t.tablename, count(p.policyname) as policies
           from pg_tables t
           left join pg_policies p
             on p.schemaname = t.schemaname and p.tablename = t.tablename
          where t.schemaname = 'packmate'
          group by t.tablename`,
      );
      return result.rows.filter((row) => Number(row.policies) === 0).map((row) => row.tablename);
    });

    expect(withoutPolicy).toEqual([]);
  });
});

// The database mirrors the application limits in lib/validation.ts
// (MAX_NAME_LENGTH = 200, MAX_WEIGHT_GRAMS = 100000), so a write that bypasses
// the app cannot exceed them. These go through PostgREST to exercise the real
// boundary, including RLS and column defaults.
describe("name length and weight ceiling constraints (integration)", () => {
  const stamp = Date.now();
  const token = mintToken(`it-limits-${stamp}`);
  const maxName = "a".repeat(200);
  const overName = "a".repeat(201);

  async function createTrip(name = "Limits trip"): Promise<string> {
    const trip = await rest("trips", token, {
      method: "POST",
      body: JSON.stringify({ name, country_code: "JP" }),
    });
    expect(trip.status).toBe(201);
    return (trip.body as { id: string }[])[0].id;
  }

  it("rejects a name over the maximum on every named table", async () => {
    const item = await rest("reusable_items", token, {
      method: "POST",
      body: JSON.stringify({ name: overName, default_qty: 1 }),
    });
    expect(item.status).toBeGreaterThanOrEqual(400);

    const bag = await rest("reusable_bags", token, {
      method: "POST",
      body: JSON.stringify({ name: overName }),
    });
    expect(bag.status).toBeGreaterThanOrEqual(400);

    const trip = await rest("trips", token, {
      method: "POST",
      body: JSON.stringify({ name: overName }),
    });
    expect(trip.status).toBeGreaterThanOrEqual(400);

    const tripId = await createTrip();

    const tripBag = await rest("trip_bags", token, {
      method: "POST",
      body: JSON.stringify({ trip_id: tripId, name: overName }),
    });
    expect(tripBag.status).toBeGreaterThanOrEqual(400);

    const entry = await rest("trip_entries", token, {
      method: "POST",
      body: JSON.stringify({ trip_id: tripId, name: overName, qty: 1 }),
    });
    expect(entry.status).toBeGreaterThanOrEqual(400);
  }, 30_000);

  it("accepts a name at the maximum length on every named table", async () => {
    const item = await rest("reusable_items", token, {
      method: "POST",
      body: JSON.stringify({ name: maxName, default_qty: 1 }),
    });
    expect(item.status).toBe(201);

    const bag = await rest("reusable_bags", token, {
      method: "POST",
      body: JSON.stringify({ name: maxName }),
    });
    expect(bag.status).toBe(201);

    const tripId = await createTrip(maxName);

    const tripBag = await rest("trip_bags", token, {
      method: "POST",
      body: JSON.stringify({ trip_id: tripId, name: maxName }),
    });
    expect(tripBag.status).toBe(201);

    const entry = await rest("trip_entries", token, {
      method: "POST",
      body: JSON.stringify({ trip_id: tripId, name: maxName, qty: 1 }),
    });
    expect(entry.status).toBe(201);
  }, 30_000);

  it("rejects a library weight above the ceiling and accepts the boundary", async () => {
    const overItem = await rest("reusable_items", token, {
      method: "POST",
      body: JSON.stringify({ name: "Heavy item", default_qty: 1, weight_grams: 100001 }),
    });
    expect(overItem.status).toBeGreaterThanOrEqual(400);

    const maxItem = await rest("reusable_items", token, {
      method: "POST",
      body: JSON.stringify({ name: "Max item", default_qty: 1, weight_grams: 100000 }),
    });
    expect(maxItem.status).toBe(201);

    const overBag = await rest("reusable_bags", token, {
      method: "POST",
      body: JSON.stringify({ name: "Heavy bag", weight_limit_grams: 100001 }),
    });
    expect(overBag.status).toBeGreaterThanOrEqual(400);

    const maxBag = await rest("reusable_bags", token, {
      method: "POST",
      body: JSON.stringify({ name: "Max bag", weight_limit_grams: 100000 }),
    });
    expect(maxBag.status).toBe(201);
  }, 30_000);

  it("rejects a trip entry weight or trip bag limit above the ceiling", async () => {
    const tripId = await createTrip("Weight trip");

    const overEntry = await rest("trip_entries", token, {
      method: "POST",
      body: JSON.stringify({ trip_id: tripId, name: "Heavy", qty: 1, weight_grams: 100001 }),
    });
    expect(overEntry.status).toBeGreaterThanOrEqual(400);

    const maxEntry = await rest("trip_entries", token, {
      method: "POST",
      body: JSON.stringify({ trip_id: tripId, name: "Max", qty: 1, weight_grams: 100000 }),
    });
    expect(maxEntry.status).toBe(201);

    const overBag = await rest("trip_bags", token, {
      method: "POST",
      body: JSON.stringify({ trip_id: tripId, name: "Heavy bag", weight_limit_grams: 100001 }),
    });
    expect(overBag.status).toBeGreaterThanOrEqual(400);

    const maxBag = await rest("trip_bags", token, {
      method: "POST",
      body: JSON.stringify({ trip_id: tripId, name: "Max bag", weight_limit_grams: 100000 }),
    });
    expect(maxBag.status).toBe(201);
  }, 30_000);
});
