import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const single = vi.fn();
  const maybeSingle = vi.fn();
  const select = vi.fn(() => ({ single, maybeSingle }));
  const upsert = vi.fn(() => ({ select }));
  const from = vi.fn(() => ({ upsert, select }));
  return { from, upsert, select, single, maybeSingle };
});

const authState = vi.hoisted(() => ({
  currentUser: { uid: "u1" } as { uid: string } | null,
}));

vi.mock("./supabase", () => ({ supabase: { from: mocks.from } }));
vi.mock("./firebase", () => ({ getFirebaseAuth: () => authState }));

import { getProfile, upsertProfile } from "./data";

beforeEach(() => {
  vi.clearAllMocks();
  authState.currentUser = { uid: "u1" };
});

describe("upsertProfile", () => {
  it("validates, writes and returns the stored profile", async () => {
    const row = {
      user_id: "u1",
      display_name: "Ada",
      birthday: null,
      gender: "female",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };
    mocks.single.mockResolvedValue({ data: row, error: null });

    const result = await upsertProfile({
      displayName: "  Ada  ",
      birthday: null,
      gender: "female",
    });

    expect(result).toEqual(row);
    expect(mocks.from).toHaveBeenCalledWith("profiles");
    expect(mocks.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: "u1",
        display_name: "Ada",
        birthday: null,
        gender: "female",
      }),
      { onConflict: "user_id" },
    );
  });

  it("rejects an invalid gender before writing", async () => {
    await expect(
      upsertProfile({ displayName: null, birthday: null, gender: "unknown" }),
    ).rejects.toThrow(/valid gender/i);
    expect(mocks.upsert).not.toHaveBeenCalled();
  });

  it("requires a signed-in user", async () => {
    authState.currentUser = null;
    await expect(
      upsertProfile({ displayName: null, birthday: null, gender: null }),
    ).rejects.toThrow(/signed in/i);
    expect(mocks.upsert).not.toHaveBeenCalled();
  });
});

describe("getProfile", () => {
  it("returns null when no profile row exists", async () => {
    mocks.maybeSingle.mockResolvedValue({ data: null, error: null });
    await expect(getProfile()).resolves.toBeNull();
  });

  it("returns the profile row", async () => {
    const row = {
      user_id: "u1",
      display_name: "Ada",
      birthday: "1990-05-28",
      gender: "female",
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    };
    mocks.maybeSingle.mockResolvedValue({ data: row, error: null });
    await expect(getProfile()).resolves.toEqual(row);
  });
});
