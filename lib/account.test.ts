import { describe, expect, it } from "vitest";
import type { User } from "firebase/auth";
import {
  EXPORT_SCHEMA_VERSION,
  buildExportPayload,
  hasGoogleProvider,
  hasPasswordProvider,
  linkedProviderIds,
} from "./account";
import type { ExportedData } from "./data";

function fakeUser(providerIds: string[]): User {
  return {
    providerData: providerIds.map((providerId) => ({ providerId })),
  } as unknown as User;
}

const emptyData: ExportedData = {
  profile: null,
  reusable_items: [],
  reusable_bags: [],
  reusable_bag_items: [],
  trips: [],
  trip_bags: [],
  trip_entries: [],
  share_links: [],
};

describe("linked providers", () => {
  it("lists provider ids", () => {
    expect(linkedProviderIds(fakeUser(["password", "google.com"]))).toEqual([
      "password",
      "google.com",
    ]);
  });

  it("detects password and google providers", () => {
    expect(hasPasswordProvider(fakeUser(["password"]))).toBe(true);
    expect(hasPasswordProvider(fakeUser(["google.com"]))).toBe(false);
    expect(hasGoogleProvider(fakeUser(["google.com"]))).toBe(true);
    expect(hasGoogleProvider(fakeUser(["password"]))).toBe(false);
  });
});

describe("buildExportPayload", () => {
  it("produces a versioned payload containing every collection", () => {
    const payload = buildExportPayload(emptyData, "2026-09-14T00:00:00.000Z");

    expect(payload.schemaVersion).toBe(EXPORT_SCHEMA_VERSION);
    expect(payload.exportedAt).toBe("2026-09-14T00:00:00.000Z");
    expect(payload.profile).toBeNull();
    expect(payload.reusable_items).toEqual([]);
    expect(payload.trips).toEqual([]);
    expect(payload.trip_entries).toEqual([]);
  });

  it("is serialisable to JSON", () => {
    const payload = buildExportPayload(emptyData, "2026-09-14T00:00:00.000Z");
    expect(() => JSON.stringify(payload)).not.toThrow();
  });

  it("includes share links", () => {
    const link = {
      id: "s1",
      trip_id: "t1",
      user_id: "u1",
      token: "a".repeat(64),
      created_at: "2026-09-14T00:00:00.000Z",
      expires_at: null,
      revoked_at: null,
    };
    const payload = buildExportPayload(
      { ...emptyData, share_links: [link] },
      "2026-09-14T00:00:00.000Z",
    );
    expect(payload.share_links).toEqual([link]);
  });
});
