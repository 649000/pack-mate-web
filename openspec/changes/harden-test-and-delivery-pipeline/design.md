## Context

See `proposal.md` — Why. The current delivery shape is: static Next.js export on Firebase Hosting, Firebase Auth bridged into Supabase PostgREST via an auth blocking function that stamps the `authenticated` role claim, and row-level security keyed on `auth.jwt()->>'sub'` (a text uid, not a UUID). The pipeline runs on `main` only. Integration and authenticated end-to-end tests currently execute inside the deploy workflow, after the deploy.

Constraints that shape the approach:

- The project is pre-launch and trunk-based; `main` is the only gate before production.
- Cost must stay minimal; no always-on resources.
- Supabase RLS requires the identity token to carry `role: authenticated`; that claim comes from the deployed blocking function, not from the identity provider's defaults.

## Goals / Non-Goals

**Goals:**

- Verify RLS, the identity-token bridge and the authenticated UI flow before deploying, not after.
- Keep every automated test off production, except one minimal post-deploy smoke.
- Apply schema changes through the pipeline rather than by hand.
- Be conformant with the existing `delivery` and `automated-testing` specs.
- Adopt a pull-request trigger without rework when the workflow changes.

**Non-Goals:**

- Load, performance or visual-regression testing.
- A staging environment or preview channels.
- Testing Google popup sign-in (email/password flows only).
- Multi-region or blue-green deployment.

## Decisions

### Public configuration is environment-driven

- **Why:** builds must target a non-production backend for tests, and the spec requires test/production isolation. Validating required public values at load makes a misconfigured build fail fast instead of silently pointing at the wrong backend.
- **Alternative — keep the single committed production config:** rejected; it couples tests to production values and cannot express multiple environments.
- **Consequence:** `.env.example` documents the variables, `.env.test` holds non-secret test values, and CI supplies values per environment. Public values remain non-secret; only genuine secrets live in encrypted CI secrets.

### Integration tests use an ephemeral local Supabase stack plus a dedicated non-production identity provider

- **Why:** a local Supabase stack is rebuilt from the committed migrations, so it verifies the schema and policies that actually ship, with no production writes, and can run before deploy.
- **Alternative — Firebase Auth emulator:** rejected. Local Supabase's third-party Firebase integration verifies tokens against Google's real JWKS, so emulator-signed tokens are rejected. The bridge cannot be emulated.
- **Alternative — staging Supabase project:** rejected as more cost and operational surface for no additional fidelity; local Postgres with RLS is the same engine.
- **Alternative — Supabase-native auth only:** rejected; it would test RLS but not the identity-token bridge, which is the security-critical seam.
- **Consequence:** the identity provider for tests must be a real, dedicated project whose tokens local Supabase is configured to trust.

### The auth blocking functions are deployed to the test identity project

- **Why:** the `authenticated` role claim is produced by the blocking functions. Without them deployed to the test project, its tokens lack the claim and every RLS test would run as `anon` and fail.
- **Consequence:** deploying `functions/` to the test project is part of setup and must be kept current.

### Verification runs before deploy; the pull-request trigger is wired but inert

- **Why:** with trunk-based development, the deploy workflow is the only gate, so integration and end-to-end tests must complete before the deploy step. Adding the `pull_request` trigger now (when no pull requests exist) means no pipeline rework at launch.
- **Alternative — keep verification post-deploy:** rejected; it detects breakage only after it is live.
- **Consequence:** the pipeline is structured so the same required checks serve both `main` pushes and, later, pull requests.

### Migrations are applied by CI behind a protected environment

- **Why:** schema changes should be versioned, reviewed and applied by the pipeline, not by hand. The migration step only runs when migration files change, and requires the protected environment's approval.
- **Alternative — manual `supabase db push`:** rejected; it bypasses review and ordering.
- **Alternative — fully automatic with no approval:** rejected; schema changes are the highest-consequence operation and warrant an explicit gate.

### A single minimal smoke replaces the broad live suite

- **Why:** the broad live suite existed because nothing else could reach a live backend; once tests run locally against the real bridge, the only thing that needs production is confirming the deployed configuration works. One sign-up and one RLS-scoped read, cleaned up afterward, proves the deployed blocking function and third-party-auth configuration without polluting production.

### End-to-end tests run against the production static build

- **Why:** the app is a static export; serving `out/` is closer to production than the development server and preserves the generated `404.html` semantics the not-found test relies on.

### Build once and promote the artifact

- **Why:** rebuilding per job risks drift between what was tested and what is deployed. The build job produces the artifact; later jobs consume it.

### Superseded decisions

This change reverses four decisions recorded in the archived `2026-09-14-quality-and-delivery` change and now encoded in the main specs:

| Superseded decision | Replacement | Reason |
| --- | --- | --- |
| Public client config is committed | Environment-driven public config | Needed to target non-production backends and to validate per environment |
| Integration tests run after deploy, not in pull-request CI | Integration runs before deploy, on `main` and later on pull requests | Post-deploy detection is too late |
| No multi-environment promotion | A dedicated non-production identity provider (no staging environment) | The bridge cannot be emulated, so a real non-production project is required |
| Authenticated end-to-end deferred | Authenticated end-to-end runs in CI | A non-production identity provider now exists, removing the blocker |

## Risks / Trade-offs

- **Local Supabase may reject non-production identity tokens** → validate this first as a decision gate; if it fails, fall back to a staging Supabase project and revisit this design.
- **The non-production identity provider is a new CI network dependency** → it is the same dependency production already uses; add retries to absorb transient failures.
- **The production smoke still runs after deploy** → unavoidable without a staging deploy; keep it minimal and pair it with failure alerting.
- **Docker adds CI time and cost** → acceptable; local Postgres is the highest-fidelity, lowest-cost option. No always-on resources are introduced.
- **Coverage threshold could fail immediately** → start at the measured baseline and ratchet rather than picking an arbitrary number.
- **Two identity projects and their third-party-auth configuration can drift** → keep the test project's functions deployed from the same source in CI.
- **Google popup sign-in remains untested** → accepted limitation; email/password covers the bridge.

## Migration Plan

Incremental and trunk-based. Order:

1. Spike: confirm the local stack accepts non-production identity tokens with the role claim.
2. Introduce environment-driven config without changing production behavior (defaults unchanged).
3. Add the local-stack scripts and rewrite the integration suite; confirm it passes locally and in CI before deploy.
4. Move the authenticated end-to-end flow into pre-deploy CI against the production build.
5. Add coverage and scanning gates at the measured baseline.
6. Restructure the pipeline: required checks, migration step behind the protected environment, deploy, smoke.

Rollback: redeploy the previous static build via the pipeline. Migrations are forward-only, so a schema rollback is a new migration, not a revert.

## Open Questions

None. The one unresolved technical question — whether the local stack accepts non-production identity tokens — is a decision gate in the migration plan with a defined fallback.
