import { defineConfig } from "vitest/config";
import path from "node:path";

// Production smoke: the only suite that talks to the deployed backend. It proves
// the identity bridge (Firebase token -> Supabase) works in production, then
// cleans up. It must never run against anything but production, so it is kept
// out of every other config and invoked explicitly after a deploy.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "."),
    },
  },
  test: {
    environment: "node",
    include: ["tests/smoke/**/*.test.ts"],
    testTimeout: 30_000,
  },
});
