import crypto from "node:crypto";
import { Client } from "pg";

// Integration tests run against an ephemeral local Supabase stack. The stack
// does not verify third-party Firebase tokens (see the change design), so tests
// mint local HS256 tokens with the stack's JWT secret. The values below are the
// deterministic Supabase CLI development defaults, not secrets.
//
// Overrides use a PACKMATE_TEST_ prefix on purpose: generic SUPABASE_* variables
// may point at production in a developer shell, and tests must never touch it.
export const SCHEMA = "packmate";

export const SUPABASE_URL = process.env.PACKMATE_TEST_SUPABASE_URL ?? "http://127.0.0.1:54321";
export const SUPABASE_PUBLISHABLE_KEY =
  process.env.PACKMATE_TEST_SUPABASE_KEY ?? "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH";
export const SUPABASE_DB_URL =
  process.env.PACKMATE_TEST_DB_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
const SUPABASE_JWT_SECRET =
  process.env.PACKMATE_TEST_JWT_SECRET ?? "super-secret-jwt-token-with-at-least-32-characters-long";

function base64url(input: string): string {
  return Buffer.from(input).toString("base64url");
}

export function mintToken(sub: string): string {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64url(
    JSON.stringify({
      role: "authenticated",
      sub,
      aud: "authenticated",
      iss: `${SUPABASE_URL}/auth/v1`,
      exp: Math.floor(Date.now() / 1000) + 3600,
    }),
  );
  const data = `${header}.${payload}`;
  const signature = crypto
    .createHmac("sha256", SUPABASE_JWT_SECRET)
    .update(data)
    .digest("base64url");
  return `${data}.${signature}`;
}

function headers(token: string | null, extra: Record<string, string> = {}) {
  return {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    "Accept-Profile": SCHEMA,
    "Content-Profile": SCHEMA,
    "Content-Type": "application/json",
    Prefer: "return=representation",
    ...extra,
  };
}

export async function rest(path: string, token: string | null, init: RequestInit = {}) {
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

export async function withDb<T>(fn: (client: Client) => Promise<T>): Promise<T> {
  const client = new Client({ connectionString: SUPABASE_DB_URL });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}
