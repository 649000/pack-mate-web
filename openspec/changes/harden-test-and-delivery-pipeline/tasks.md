## 1. Spike: local identity approach

- [x] 1.1 Determine whether the local Supabase stack verifies third-party Firebase tokens; verify with a real token and record the result (it does not — `JWSInvalidSignature`)
- [x] 1.2 Confirm the auth blocking function stamps the `authenticated` role claim on a real token; verify by decoding a fresh token's claims
- [x] 1.3 Verify that locally-minted HS256 tokens (`role: authenticated`, `sub: <uid>`) are accepted by local PostgREST and that RLS scopes on `sub`
- [x] 1.4 Update `design.md` and the delta specs with the spike outcome and the chosen approach; verify `openspec validate harden-test-and-delivery-pipeline --strict`

## 2. Environment-driven configuration

- [x] 2.1 Rewrite `lib/public-config.ts` to read `NEXT_PUBLIC_*` and validate required values at load, failing fast; verify the app builds with `.env.test` and with production values
- [x] 2.2 Add `.env.example` documenting every variable and `.env.test` with non-secret local values; verify `.env.test` is tracked and no secret material is committed
- [x] 2.3 Confirm production behavior is unchanged by defaulting to the existing values where appropriate; verify a production build still points at the production backend

## 3. Local stack and hermetic integration

- [x] 3.1 Pin the Supabase CLI as a dev dependency and add `supabase:start`, `supabase:stop`, `supabase:reset` scripts; verify each script runs locally
- [x] 3.2 Add `tests/integration/helpers.ts` for local key discovery and minting identity tokens; verify the helpers are exercised by the suite
- [x] 3.3 Rewrite `tests/integration/rls.test.ts` to run against `http://127.0.0.1:54321` with minted tokens, keeping every existing assertion (cross-user denial, forged owner, copy-on-add, cascades, exclusivity, order/quantity, URL validation, profiles); verify `npm run test:integration` passes against Docker with no production access
- [x] 3.4 Add assertions that a rebuilt schema contains the required tables and RLS policies; verify the assertions pass after `supabase db reset`
- [x] 3.5 Add an assertion that an unauthenticated request returns no rows; verify it passes locally

## 4. Pre-deploy end-to-end

- [x] 4.1 Change `playwright.config.ts` to build and serve the static `out/` output instead of the development server; verify `npm run test:e2e` passes against the served build
- [x] 4.2 Keep the authenticated flow gated (`E2E_AUTH=1`) and documented as running against the deployed backend, because local Supabase cannot verify Firebase tokens; verify the gate is respected
- [x] 4.3 Confirm `e2e/app.spec.ts` (including the not-found and reset-password checks) runs against the built output and writes no production application data; verify no production data requests occur during the run

## 5. Quality gates

- [x] 5.1 Add `@vitest/coverage-v8`, a coverage configuration and a `test:coverage` script at the measured baseline; verify CI fails when coverage drops below the threshold
- [x] 5.2 Add dependency vulnerability scanning and a high-severity failure gate; verify a known-vulnerable dependency fails the check
- [x] 5.3 Add secret scanning and dependency review to the pipeline; verify the checks are present and pass on a clean tree

## 6. Pipeline restructure

- [x] 6.1 Add the `pull_request` trigger alongside `push: main` and `workflow_dispatch`, and restructure the required pre-deploy jobs (typecheck, lint/format, unit+coverage, integration, build+bundle, e2e); verify the workflow file is valid
- [x] 6.2 Build once and promote the artifact to later jobs instead of rebuilding; verify deploy uses the tested artifact
- [x] 6.3 Add the migration step (`supabase db push`) that runs only when migration files change and is bound to a protected environment; a non-schema commit skips it (verified in CI) and the `production` environment requires a reviewer
- [x] 6.4 Configure the required secrets and variables (`SUPABASE_ACCESS_TOKEN`, production project ref, `FIREBASE_SERVICE_ACCOUNT`); verified by a successful end-to-end `main` deploy (run 35112486907)

## 7. Production smoke

- [x] 7.1 Replace the broad post-deploy live suite with a minimal smoke that signs up, performs one RLS-scoped read and deletes the user; verify it passes after deploy and leaves no residue
- [x] 7.2 Confirm the smoke and the gated authenticated flow are the only checks that touch production data, and that the smoke removes its identity; verify no other job writes to production data resources

## 8. Spec conformance and documentation

- [x] 8.1 Confirm the pipeline satisfies the `automated-testing` and `delivery` requirements, including the previously unmet pull-request CI requirement; verify against `openspec validate harden-test-and-delivery-pipeline --strict`
- [x] 8.2 Update `AGENTS.md` to reflect the environment-driven configuration and the pre-deploy verification model; verify the documented commands match the scripts
