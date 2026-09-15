// Public share links are opaque tokens in the query string. Static export
// cannot build a dynamic route at build time, so the token travels as `?t=`.
import type { ShareLink } from "./types";

export const SHARE_PATH = "/share";
export const SHARE_TOKEN_PARAM = "t";

const SHARE_TOKEN_PATTERN = /^[0-9a-f]{64}$/;

export function isShareToken(value: string | null | undefined): value is string {
  return typeof value === "string" && SHARE_TOKEN_PATTERN.test(value);
}

export function buildShareUrl(token: string, origin: string): string {
  return `${origin.replace(/\/+$/, "")}${SHARE_PATH}?${SHARE_TOKEN_PARAM}=${token}`;
}

export function shareTokenFromSearch(search: string): string {
  return new URLSearchParams(search).get(SHARE_TOKEN_PARAM) ?? "";
}

export type ShareLinkStatus = "active" | "revoked" | "expired";

export function shareLinkStatus(
  link: Pick<ShareLink, "revoked_at" | "expires_at">,
  now: number = Date.now(),
): ShareLinkStatus {
  if (link.revoked_at !== null) return "revoked";
  if (link.expires_at !== null && new Date(link.expires_at).getTime() <= now) return "expired";
  return "active";
}

export const SHARE_EXPIRY_OPTIONS = [
  { value: "never", label: "Never" },
  { value: "7", label: "In 7 days" },
  { value: "30", label: "In 30 days" },
] as const;

export type ShareExpiry = (typeof SHARE_EXPIRY_OPTIONS)[number]["value"];

export function shareExpiryToDate(value: ShareExpiry, now: number = Date.now()): string | null {
  if (value === "never") return null;
  const days = Number(value);
  return new Date(now + days * 24 * 60 * 60 * 1000).toISOString();
}
