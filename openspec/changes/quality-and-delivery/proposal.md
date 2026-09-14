## Why

The project has no automated quality gates and no deployment pipeline. Verifying changes by hand does not scale and misses regressions, and deploying from a developer machine is error-prone. Testing and delivery must be automated so every change is verified and releases are repeatable.

## What Changes

- Add unit tests (Vitest) for domain logic and validation.
- Add end-to-end UI tests (Playwright) covering the public pages, auth gating, responsive layout and error states.
- Add an integration test that exercises data access and RLS against a live Supabase project using two users.
- Add a bundle check that fails if secret material appears in the build output.
- Add GitHub Actions CI (lint, type-check, unit, build, bundle check, e2e) on pull requests and main.
- Add GitHub Actions deploy (Hosting + Functions) on main, followed by live integration verification.
- Commit public client config and keep only genuine secrets out of the repository.

## Capabilities

### New Capabilities

- `automated-testing`: unit, end-to-end, integration (including RLS) and bundle-secret tests.
- `delivery`: continuous integration and deployment through GitHub Actions.

### Modified Capabilities

<!-- None. -->

## Impact

- New dev dependencies: `vitest`, `@playwright/test`.
- New files: `vitest.config.mts`, `vitest.integration.config.mts`, `playwright.config.ts`, `e2e/`, `tests/integration/`, `scripts/check-bundle.mjs`, `.github/workflows/ci.yml`, `.github/workflows/deploy.yml`.
- Public client config moves to a committed module (`lib/public-config.ts`); no public values are stored as CI secrets.
- CI deploy requires a `FIREBASE_SERVICE_ACCOUNT` secret only.
- AGENTS.md updated with testing, cost and CI/CD expectations.
