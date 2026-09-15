## 1. Spike and non-production identity project

- [ ] 1.1 Create a dedicated non-production Firebase project, upgrade it to Identity Platform, and deploy `functions/` to it; verify a token from the project is issued and carries the `authenticated` role claim
- [ ] 1.2 Enable `[auth.third_party.firebase]` in `supabase/config.toml` with the non-production `project_id`; verify `supabase start` boots with the setting enabled
- [ ] 1.3 Prove the local stack accepts a real non-production ID token and that RLS resolves `auth.jwt()->>'sub'`; verify with a throwaway request against local PostgREST
- [ ] 1.4 Record the spike outcome; if it fails, stop and re-plan the fallback to a staging Supabase project

## 2. Environment-driven configuration

- [ ] 2.1 Rewrite `lib/public-config.ts` to read `NEXT_PUBLIC_*` and validate required values at load, failing fast; verify the app builds with `.env.test` and with production values
- [ ] 2.2 Add `.env.example` documenting every variable and `.env.test` with non-secret test values; verify `.env.test` is tracked and no secret material is committed
- [ ] 2.3 Confirm production behavior is unchanged by defaulting to the existing values where appropriate; verify a production build still points at the production backend

## 3. Local stack and hermetic integration

- [ ] 3.1 Pin the Supabase CLI as a dev dependency and add `supabase:start`, `supabase:stop`, `supabase:reset` scripts; verify each script runs locally
- [ ] 3.2 Add `tests/integration/helpers.ts` for stack lifecycle, local key discovery and non-production user creation/deletion; verify helpers are exercised by the suite
- [ ] 3.3 Rewrite `tests/integration/rls.test.ts` to run against `http://127.0.0.1:54321` with non-production ID tokens, keeping every existing assertion (cross-user denial, forged owner, copy-on-add, cascades, exclusivity, order/quantity, URL validation, profiles); verify `npm run test:integration` passes against Docker with no production access
- [ ] 3.4 Add assertions that a rebuilt schema contains the required tables and RLS policies; verify the assertions pass after `supabase db reset`
- [ ] 3.5 Add a token-bridge assertion that a non-production token is accepted and runs as an authenticated user; verify it passes locally

## 4. Pre-deploy end-to-end

- [ ] 4.1 Change `playwright.config.ts` to build and serve the static `out/` output instead of the development server; verify `npm run test:e2e` passes against the served build
- [ ] 4.2 Remove the `E2E_AUTH` gate from `e2e/authenticated.spec.ts` so the authenticated flow runs in CI against the non-production backend; verify it passes
- [ ] 4.3 Confirm `e2e/app.spec.ts` (including the not-found and reset-password checks) runs against the non-production identity provider and produces no production traffic; verify no production requests occur during the run

## 5. Quality gates

- [ ] 5.1 Add `@vitest/coverage-v8`, a coverage configuration and a `test:coverage` script at the measured baseline; verify CI fails when coverage drops below the threshold
- [ ] 5.2 Add dependency vulnerability scanning and a high-severity failure gate; verify a known-vulnerable dependency fails the check
- [ ] 5.3 Add secret scanning and dependency review to the pipeline; verify the checks are present and pass on a clean tree

## 6. Pipeline restructure

- [ ] 6.1 Add the `pull_request` trigger alongside `push: main` and `workflow_dispatch`, and restructure the required pre-deploy jobs (typecheck, lint/format, unit+coverage, integration, build+bundle, e2e); verify the workflow file is valid
- [ ] 6.2 Build once and promote the artifact to later jobs instead of rebuilding; verify deploy uses the tested artifact
- [ ] 6.3 Add the migration step (`supabase db push`) that runs only when migration files change and is bound to a protected environment; verify a schema-changing commit pauses for approval and a non-schema commit skips it
- [ ] 6.4 Configure the required secrets and variables (`SUPABASE_ACCESS_TOKEN`, production project ref, non-production deploy credentials, public `NEXT_PUBLIC_*` variables); verify a main deploy succeeds end to end

## 7. Production smoke

- [ ] 7.1 Replace the broad post-deploy live suite with a minimal smoke that signs up, performs one RLS-scoped read and deletes the user; verify it passes after deploy and leaves no residue
- [ ] 7.2 Confirm the smoke is the only check that touches production; verify no other job reads from or writes to production resources

## 8. Spec conformance and documentation

- [ ] 8.1 Confirm the pipeline satisfies the `automated-testing` and `delivery` requirements, including the previously unmet pull-request CI requirement; verify against `openspec validate harden-test-and-delivery-pipeline --strict`
- [ ] 8.2 Update `AGENTS.md` to reflect the environment-driven configuration and the pre-deploy verification model; verify the documented commands match the scripts
