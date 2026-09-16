import { defineConfig, devices } from "@playwright/test";

// Unauthenticated end-to-end tests run against the production static build served
// over HTTP, pointed at the local Supabase stack via .env.test, so they write no
// production data. The authenticated flow is gated behind E2E_AUTH=1 and runs
// against the deployed backend, because the local stack cannot verify Firebase
// tokens (see openspec/changes/harden-test-and-delivery-pipeline/design.md).
const authEnabled = process.env.E2E_AUTH === "1";

if (!authEnabled) {
  try {
    process.loadEnvFile(".env.test");
  } catch {
    // .env.test is committed; a missing file is only a problem for the build below.
  }
}

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  expect: {
    timeout: 15_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    // In CI the build is produced once and promoted as an artifact, so the
    // server only needs to serve it (PLAYWRIGHT_SERVE_ONLY=1).
    command: process.env.PLAYWRIGHT_SERVE_ONLY
      ? "npx serve out -l 3000"
      : "npm run build && npx serve out -l 3000",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
