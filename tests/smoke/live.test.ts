import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import { publicConfig } from "@/lib/public-config";

// The local stack cannot verify third-party Firebase tokens, so the identity
// bridge is only observable here, against the deployed backend. This test signs
// up a disposable user, performs one row-level-security-scoped write and read,
// then deletes both the data and the user.
const { apiKey } = publicConfig.firebase;
const { url, publishableKey } = publicConfig.supabase;
const SCHEMA = "packmate";

async function signUp(email: string): Promise<string> {
  // A fresh, random password per run: no credential literal lives in the repo,
  // and any account left behind cannot be signed into with a known password.
  const password = `Test-pass-${crypto.randomUUID()}`;
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, returnSecureToken: true }),
    },
  );
  const json = await res.json();
  if (!res.ok) throw new Error(`signUp failed (${res.status}): ${JSON.stringify(json)}`);
  return json.idToken as string;
}

async function deleteUser(idToken: string): Promise<void> {
  await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:delete?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
}

function headers(token: string): Record<string, string> {
  return {
    apikey: publishableKey,
    Authorization: `Bearer ${token}`,
    "Accept-Profile": SCHEMA,
    "Content-Profile": SCHEMA,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

describe("production identity bridge (smoke)", () => {
  it("accepts a fresh identity and scopes a write and read to it", async () => {
    const email = `packmate-smoke-${Date.now()}@example.com`;
    const idToken = await signUp(email);

    try {
      const created = await fetch(`${url}/rest/v1/reusable_items`, {
        method: "POST",
        headers: headers(idToken),
        body: JSON.stringify({ name: "Smoke item", default_qty: 1 }),
      });
      expect(created.status).toBe(201);
      const rows = (await created.json()) as { id: string; user_id: string }[];
      expect(rows[0].user_id).toBeTruthy();

      const read = await fetch(`${url}/rest/v1/reusable_items?select=id&id=eq.${rows[0].id}`, {
        headers: headers(idToken),
      });
      expect(read.status).toBe(200);
      expect((await read.json()) as unknown[]).toHaveLength(1);

      await fetch(`${url}/rest/v1/reusable_items?id=eq.${rows[0].id}`, {
        method: "DELETE",
        headers: headers(idToken),
      });
    } finally {
      await deleteUser(idToken);
    }
  }, 30_000);
});
