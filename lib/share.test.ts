import { describe, expect, it } from "vitest";
import {
  buildShareUrl,
  isShareToken,
  shareExpiryToDate,
  shareLinkStatus,
  shareTokenFromSearch,
  SHARE_PATH,
} from "./share";

const TOKEN = "a".repeat(64);

describe("isShareToken", () => {
  it("accepts a 64-character lowercase hex token", () => {
    expect(isShareToken(TOKEN)).toBe(true);
  });

  it("rejects wrong length, non-hex, empty and non-string values", () => {
    expect(isShareToken("a".repeat(63))).toBe(false);
    expect(isShareToken("A".repeat(64))).toBe(false);
    expect(isShareToken("g".repeat(64))).toBe(false);
    expect(isShareToken("")).toBe(false);
    expect(isShareToken(null)).toBe(false);
    expect(isShareToken(undefined)).toBe(false);
  });
});

describe("buildShareUrl", () => {
  it("builds a share URL on the share path", () => {
    expect(buildShareUrl(TOKEN, "https://packmate.app")).toBe(
      `https://packmate.app${SHARE_PATH}?t=${TOKEN}`,
    );
  });

  it("does not double up slashes on the origin", () => {
    expect(buildShareUrl(TOKEN, "https://packmate.app/")).toBe(
      `https://packmate.app${SHARE_PATH}?t=${TOKEN}`,
    );
  });
});

describe("shareTokenFromSearch", () => {
  it("reads the token from a query string", () => {
    expect(shareTokenFromSearch(`?t=${TOKEN}`)).toBe(TOKEN);
  });

  it("returns an empty string when the token is absent", () => {
    expect(shareTokenFromSearch("")).toBe("");
    expect(shareTokenFromSearch("?other=1")).toBe("");
  });
});

describe("shareLinkStatus", () => {
  const now = Date.parse("2026-09-15T12:00:00.000Z");

  it("is active when not revoked and not expired", () => {
    expect(shareLinkStatus({ revoked_at: null, expires_at: null }, now)).toBe("active");
    expect(shareLinkStatus({ revoked_at: null, expires_at: "2026-09-16T00:00:00.000Z" }, now)).toBe(
      "active",
    );
  });

  it("is expired once the expiry has passed", () => {
    expect(shareLinkStatus({ revoked_at: null, expires_at: "2026-09-15T11:00:00.000Z" }, now)).toBe(
      "expired",
    );
  });

  it("is revoked regardless of expiry", () => {
    expect(shareLinkStatus({ revoked_at: "2026-09-15T10:00:00.000Z", expires_at: null }, now)).toBe(
      "revoked",
    );
  });
});

describe("shareExpiryToDate", () => {
  const now = Date.parse("2026-09-15T12:00:00.000Z");

  it("maps never to no expiry", () => {
    expect(shareExpiryToDate("never", now)).toBeNull();
  });

  it("maps a day count to an ISO date in the future", () => {
    expect(shareExpiryToDate("7", now)).toBe("2026-09-22T12:00:00.000Z");
    expect(shareExpiryToDate("30", now)).toBe("2026-10-15T12:00:00.000Z");
  });
});
