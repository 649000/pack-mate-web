import { beforeAll, describe, expect, it } from "vitest";
import { SUPABASE_URL, mintToken, rest } from "./helpers";

const stamp = Date.now();
const token = mintToken(`it-facts-${stamp}`);

describe("destination facts RLS (integration)", () => {
  beforeAll(async () => {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/`);
    } catch {
      throw new Error(
        `Local Supabase is not reachable at ${SUPABASE_URL}. Run "npm run supabase:start" first.`,
      );
    }
  }, 30_000);

  it("is readable by an authenticated user", async () => {
    const res = await rest("destination_facts?select=country_code&country_code=eq.JP", token);
    expect(res.status).toBe(200);
    expect((res.body as { country_code: string }[])[0]?.country_code).toBe("JP");
  });

  it("is readable by an anonymous visitor", async () => {
    const res = await rest("destination_facts?select=country_code&country_code=eq.US", null);
    expect(res.status).toBe(200);
    expect((res.body as { country_code: string }[])[0]?.country_code).toBe("US");
  });

  it("rejects an insert, update and delete from any client", async () => {
    const insert = await rest("destination_facts", token, {
      method: "POST",
      body: JSON.stringify({ country_code: "ZZ", currency_code: "USD" }),
    });
    expect(insert.status).toBeGreaterThanOrEqual(400);

    const update = await rest("destination_facts?country_code=eq.JP", token, {
      method: "PATCH",
      body: JSON.stringify({ currency_code: "XXX" }),
    });
    expect(update.status).toBeGreaterThanOrEqual(400);
    expect(Array.isArray(update.body) ? update.body.length : 0).toBe(0);

    const remove = await rest("destination_facts?country_code=eq.JP", token, {
      method: "DELETE",
    });
    expect(remove.status).toBeGreaterThanOrEqual(400);

    const after = await rest("destination_facts?select=currency_code&country_code=eq.JP", token);
    expect((after.body as { currency_code: string }[])[0]?.currency_code).toBe("JPY");
  });
});
