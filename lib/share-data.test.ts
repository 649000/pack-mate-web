import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ShareLink } from "./types";

type Result = { data: unknown; error: unknown };

const fromResults: Result[] = [];
const rpc = vi.fn();
const from = vi.fn();

function builder(resolve: () => Result) {
  const target = {};
  const proxy: unknown = new Proxy(target, {
    get(_target, prop) {
      if (prop === "then") {
        return (onFulfilled: (value: Result) => unknown) =>
          Promise.resolve(resolve()).then(onFulfilled);
      }
      return () => proxy;
    },
  });
  return proxy;
}

vi.mock("./supabase", () => ({
  supabase: {
    from: (...args: unknown[]) => from(...args),
    rpc: (...args: unknown[]) => rpc(...args),
  },
}));

import { createShareLink, getSharedTrip, listShareLinks } from "./data";

const TOKEN = "b".repeat(64);

function link(overrides: Partial<ShareLink> = {}): ShareLink {
  return {
    id: "s1",
    trip_id: "t1",
    user_id: "u1",
    token: TOKEN,
    created_at: "2026-09-14T00:00:00.000Z",
    expires_at: null,
    revoked_at: null,
    ...overrides,
  };
}

beforeEach(() => {
  fromResults.length = 0;
  from.mockReset();
  rpc.mockReset();
  from.mockImplementation(() => builder(() => fromResults.shift() ?? { data: null, error: null }));
});

describe("listShareLinks", () => {
  it("returns the owner's links", async () => {
    fromResults.push({ data: [link()], error: null });
    await expect(listShareLinks()).resolves.toEqual([link()]);
    expect(from).toHaveBeenCalledWith("share_links");
  });
});

describe("createShareLink", () => {
  it("creates a link when the trip has none", async () => {
    fromResults.push({ data: null, error: null });
    fromResults.push({ data: link(), error: null });

    await expect(createShareLink("t1")).resolves.toEqual(link());
  });

  it("reuses an active, unexpired link", async () => {
    fromResults.push({ data: link({ expires_at: "2099-01-01T00:00:00.000Z" }), error: null });

    await expect(createShareLink("t1")).resolves.toEqual(
      link({ expires_at: "2099-01-01T00:00:00.000Z" }),
    );
    expect(from).toHaveBeenCalledTimes(1);
  });

  it("revokes an expired link before minting a new token", async () => {
    fromResults.push({ data: link({ expires_at: "2000-01-01T00:00:00.000Z" }), error: null });
    fromResults.push({ data: null, error: null });
    fromResults.push({ data: link({ id: "s2", token: "c".repeat(64) }), error: null });

    const created = await createShareLink("t1");

    expect(created.id).toBe("s2");
    expect(from).toHaveBeenCalledTimes(3);
  });
});

describe("getSharedTrip", () => {
  it("returns the projection for a token", async () => {
    const payload = {
      v: 2,
      trip: {
        name: "Japan",
        destination: null,
        country_code: "JP",
        start_date: null,
        end_date: null,
      },
      bags: [],
      entries: [],
    };
    rpc.mockResolvedValue({ data: payload, error: null });

    await expect(getSharedTrip(TOKEN)).resolves.toEqual(payload);
    expect(rpc).toHaveBeenCalledWith("get_shared_trip", { p_token: TOKEN });
  });

  it("returns null for an unavailable token", async () => {
    rpc.mockResolvedValue({ data: null, error: null });
    await expect(getSharedTrip(TOKEN)).resolves.toBeNull();
  });
});
