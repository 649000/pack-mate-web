## Why

The project is pre-launch and pushes directly to `main`, so the pipeline is the only gate before production. Today the strongest tests run *after* deploy: the RLS integration suite and the authenticated end-to-end flows execute inside the deploy workflow, so a broken migration, policy or auth bridge is already live before anything catches it. The `delivery` and `automated-testing` specs already require CI on pull requests, but the workflow has no `pull_request` trigger, so it is not conformant. We need verification to happen *before* deploy, and the pipeline to be ready for launch.

## What Changes

- Make public client configuration environment-driven (`NEXT_PUBLIC_*`, validated at load) instead of a single committed production config, so builds can target a non-production backend.
- Add a dedicated non-production Firebase project for tests, and run integration tests against an ephemeral local Supabase stack rebuilt from migrations, authenticated with real ID tokens from that project.
- Run integration and authenticated end-to-end tests **before** deploy (on `main`, and on pull requests when adopted), against the production static build rather than the dev server.
- Apply Supabase migrations through CI, behind a protected environment, before the app deploy.
- Replace the broad post-deploy live suite with a single minimal production smoke test.
- Add coverage thresholds and dependency/secret scanning as required checks.
- Wire a `pull_request` trigger (inert until branches are adopted) so no rework is needed at launch.

## Capabilities

### New Capabilities

<!-- None. -->

### Modified Capabilities

- `automated-testing`: integration tests move from a live production project to an ephemeral local Supabase stack with non-production Firebase identity and run pre-deploy; authenticated end-to-end flows become part of CI against a production build; add the token-bridge, coverage and security-scanning requirements; require test/production isolation.
- `delivery`: continuous integration covers all checks including integration on `main` (and pull requests when adopted); continuous deployment applies migrations via CI behind a protected environment before deploying the app; public configuration becomes environment-driven rather than a committed production config.

## Impact

- New dev dependencies: `@vitest/coverage-v8`, a pinned `supabase` CLI, and a static file server for end-to-end tests.
- New files: `.env.example`, `.env.test`, test helpers for the local stack, and a production smoke test.
- Changed: `lib/public-config.ts` (env-driven, validated), `supabase/config.toml` (third-party Firebase), `tests/integration/rls.test.ts`, `playwright.config.ts`, `e2e/authenticated.spec.ts`, `package.json` scripts, `.github/workflows/pipeline.yml`.
- New infrastructure: a dedicated test Firebase project with the auth blocking functions deployed.
- New CI secrets/vars: `SUPABASE_ACCESS_TOKEN`, the production project ref, test-project deploy credentials, and public `NEXT_PUBLIC_*` values as repository variables.
- Supersedes four decisions recorded in the archived `2026-09-14-quality-and-delivery` change (committed config, integration-after-deploy, no multi-environment, authenticated e2e deferred).
