import { describe, expect, it } from "vitest";
import { mintToken, rest } from "./helpers";

const stamp = Date.now();
const token = mintToken(`it-destination-${stamp}`);

async function createTrip(body: Record<string, unknown>) {
  return rest("trips", token, { method: "POST", body: JSON.stringify(body) });
}

describe("trip destination and country (integration)", () => {
  it("accepts a known country and a destination", async () => {
    const created = await createTrip({
      name: "Kyoto trip",
      country_code: "JP",
      destination: "Kyoto",
    });
    expect(created.status).toBe(201);
    const row = (created.body as { destination: string; country_code: string }[])[0];
    expect(row.country_code).toBe("JP");
    expect(row.destination).toBe("Kyoto");
  });

  it("accepts a trip with no destination", async () => {
    const created = await createTrip({ name: "Country only", country_code: "FR" });
    expect(created.status).toBe(201);
    expect((created.body as { destination: string | null }[])[0].destination).toBeNull();
  });

  it("rejects a trip written without a country", async () => {
    const created = await createTrip({ name: "No country" });
    expect(created.status).toBeGreaterThanOrEqual(400);
  });

  it("rejects an unknown country code", async () => {
    const created = await createTrip({ name: "Unknown country", country_code: "ZZ" });
    expect(created.status).toBeGreaterThanOrEqual(400);
  });

  it("rejects an over-long destination and accepts one at the limit", async () => {
    const over = await createTrip({
      name: "Long destination",
      country_code: "JP",
      destination: "a".repeat(201),
    });
    expect(over.status).toBeGreaterThanOrEqual(400);

    const max = await createTrip({
      name: "Max destination",
      country_code: "JP",
      destination: "a".repeat(200),
    });
    expect(max.status).toBe(201);
  }, 30_000);

  it("exposes the destination and country in the shared payload at version 2", async () => {
    const created = await createTrip({
      name: "Shared destination",
      country_code: "JP",
      destination: "Kyoto",
    });
    const tripId = (created.body as { id: string }[])[0].id;

    const link = await rest("share_links", token, {
      method: "POST",
      body: JSON.stringify({ trip_id: tripId }),
    });
    expect(link.status).toBe(201);
    const shareToken = (link.body as { token: string }[])[0].token;

    const shared = await rest("rpc/get_shared_trip", null, {
      method: "POST",
      body: JSON.stringify({ p_token: shareToken }),
    });
    expect(shared.status).toBe(200);
    const payload = shared.body as {
      v: number;
      trip: { destination: string | null; country_code: string };
    };
    expect(payload.v).toBe(2);
    expect(payload.trip.destination).toBe("Kyoto");
    expect(payload.trip.country_code).toBe("JP");
  }, 30_000);
});
