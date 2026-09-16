import { describe, expect, it } from "vitest";
import { withDb } from "./helpers";

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
