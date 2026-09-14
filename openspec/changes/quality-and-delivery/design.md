## Context

See `proposal.md` — Why. The app is delivered by the `packing-list-foundation` change; this change adds the quality gates and the release pipeline around it. Two constraints from the project shape the approach:

- The architecture is a static Next.js export plus Supabase PostgREST, with Firebase Auth bridged via a blocking function (see `packing-list-foundation` design).
- Cost must stay minimal: no always-on resources.

## Goals / Non-Goals

**Goals:**

- Automated verification of domain logic, UI behaviour, data-access security and build hygiene.
- Repeatable deployment with no manual production deploys.
- No secrets in the repository.

**Non-Goals:**

- Load, performance or visual-regression testing.
- Multi-environment promotion or preview environments.
- Authenticated end-to-end flows in CI (deferred; see Open Questions).

## Decisions

### Vitest for unit and integration, Playwright for UI

- **Why:** Vitest runs fast in the same TypeScript/tooling as the app; Playwright drives a real browser and is well suited to the responsive and auth-gating checks. Both are industry standard.
- **Alternative — Jest:** heavier configuration with ESM/Next; rejected.
- **Alternative — Cypress:** comparable, but Playwright's built-in web server and multi-viewport support fit better.

### Public client config is committed; only secrets live outside the repo

- **Why:** the Firebase web API key and the Supabase publishable key ship to the browser and are not secrets (security is enforced by Auth settings and RLS). Committing them means builds and CI need no configuration for them.
- **Consequence:** no local env files are required. The deploy workflow needs only a `FIREBASE_SERVICE_ACCOUNT` secret.

### Database migrations run through the Supabase CLI

- **Why:** `supabase db push` applies migrations using the CLI's own auth, so no database connection string (and therefore no database password) is stored in the project or CI.

### Integration tests run after deploy, not in pull-request CI

- **Why:** they need a live backend with the auth blocking function deployed. Running them in the deploy workflow verifies the real system end to end.
- **Consequence:** pull-request CI covers unit, build, bundle and UI tests; the deploy workflow adds the live RLS integration test.

### Cost discipline

- **Why:** Functions and CI can quietly accrue cost.
- **Consequence:** no min instances or provisioned throughput; the deploy runs only on main.

## Risks / Trade-offs

- **Integration tests create and delete Firebase users** → users are deleted in `afterAll`; rows are RLS-scoped and invisible to others.
- **E2E runs against the dev server** → acceptable for smoke coverage; the deploy workflow verifies the built backend separately.
- **Playwright browser download in CI** → install Chromium only.
- **A failed deploy leaves the previous build live** → acceptable; rollback is redeploying the previous commit.

## Migration Plan

Greenfield. Add the configs, tests and workflows; no data migration.

## Open Questions

- Should authenticated end-to-end flows (sign in, create a trip, pack an item) be automated with a dedicated test account? Deferred until a stable test account exists.
