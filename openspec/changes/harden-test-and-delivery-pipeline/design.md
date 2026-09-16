## Context

See `proposal.md` — Why. The current delivery shape is: static Next.js export on Firebase Hosting, Firebase Auth bridged into Supabase PostgREST via an auth blocking function that stamps the `authenticated` role claim, and row-level security keyed on `auth.jwt()->>'sub'` (a text uid, not a UUID). The pipeline runs on `main` only. Integration and authenticated end-to-end tests currently execute inside the deploy workflow, after the deploy.

Constraints that shape the approach:

- The project is pre-launch and trunk-based; `main` is the only gate before production.
- Cost must stay minimal; no always-on resources.
- Supabase RLS requires the identity token to carry `role: authenticated`; that claim comes from the deployed blocking function, not from the identity provider's defaults.
- **Verified during implementation:** the local Supabase stack does not verify third-party Firebase tokens. Local PostgREST is configured only with the local JWT keys, so a real Firebase ID token is rejected with `JWSError JWSInvalidSignature`. The Firebase Auth emulator cannot be used either, because local Supabase verifies against Google's real JWKS. The identity bridge is therefore only observable against a hosted Supabase project.

## Goals / Non-Goals

**Goals:**

- Verify RLS, policies and the schema hermetically before deploying.
- Keep unit and integration tests entirely off production.
- Verify the deployed identity bridge and the authenticated UI flow after deploying, using disposable identities.
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

- **Why:** builds should not hard-code a single backend; validating required public values at load makes a misconfigured build fail fast. It also lets the unauthenticated end-to-end run against the local stack with no production values.
- **Alternative — keep the single committed production config:** rejected; it couples every build to production values and cannot express multiple environments.
- **Consequence:** `.env.example` documents the variables, `.env.test` holds non-secret local values, and CI supplies values per environment. Public values remain non-secret; only genuine secrets live in encrypted CI secrets.

### Integration tests use an ephemeral local Supabase stack with locally-minted identity tokens

- **Why:** a local Supabase stack is rebuilt from the committed migrations, so it verifies the schema and policies that actually ship, with real Postgres and RLS and no production writes, and can run before deploy. Tokens are minted locally with the stack's JWT secret (`role: authenticated`, `sub: <uid>`), which the local PostgREST accepts and RLS scopes on.
- **Verified:** a minted token inserts and reads its own rows with `user_id` defaulting to the `sub` claim.
- **Alternative — real Firebase tokens against the local stack:** rejected; verified to fail with `JWSInvalidSignature` because the local stack does not verify third-party Firebase tokens.
- **Alternative — Firebase Auth emulator:** rejected; local Supabase verifies against Google's real JWKS, so emulator tokens cannot be accepted.
- **Alternative — staging Supabase project:** rejected as more cost and operational surface for no additional fidelity.
- **Consequence:** the identity bridge is not covered by integration tests; it is covered by the post-deploy smoke (below).

### The identity bridge is verified in production, not locally

- **Why:** the bridge is the combination of the deployed blocking function (which stamps `role: authenticated`) and Supabase's hosted third-party-auth configuration. Neither is reproducible locally, so the only faithful check is a real sign-up against the deployed backend.
- **Consequence:** a single minimal post-deploy smoke signs up, performs one RLS-scoped read and deletes the user. It proves the blocking function and the hosted third-party-auth configuration together.

### RLS and unauthenticated UI run before deploy; the authenticated UI runs after

- **Why:** with trunk-based development the deploy workflow is the only gate, so anything that can run hermetically must run before the deploy step. The authenticated UI flow cannot run hermetically (the app authenticates via Firebase, which the local stack rejects), so it stays post-deploy, gated behind `E2E_AUTH=1`.
- **Alternative — keep all verification post-deploy:** rejected; RLS and the schema can be verified earlier and should be.
- **Consequence:** the pipeline runs integration and unauthenticated end-to-end pre-deploy on `main` (and on pull requests once adopted), then deploy, then the smoke and the authenticated flow.

### Migrations are applied by CI behind a protected environment

- **Why:** schema changes should be versioned, reviewed and applied by the pipeline, not by hand. The migration step only runs when migration files change, and requires the protected environment's approval.
- **Alternative — manual `supabase db push`:** rejected; it bypasses review and ordering.
- **Alternative — fully automatic with no approval:** rejected; schema changes are the highest-consequence operation and warrant an explicit gate.

### A single minimal smoke replaces the broad live suite

- **Why:** the broad live suite existed because nothing else could reach a live backend. The only thing that genuinely needs production is the identity bridge, so one sign-up, one scoped read and a cleanup suffice. The RLS behaviour it used to prove is now covered hermetically.

### End-to-end tests run against the production static build

- **Why:** the app is a static export; serving `out/` is closer to production than the development server and preserves the generated `404.html` semantics the not-found test relies on.

### Build once and promote the artifact

- **Why:** rebuilding per job risks drift between what was tested and what is deployed. The build job produces the artifact; later jobs consume it.

### Superseded decisions

This change reverses decisions recorded in the archived `2026-09-14-quality-and-delivery` change and now encoded in the main specs:

| Superseded decision | Replacement | Reason |
| --- | --- | --- |
| Public client config is committed | Environment-driven public config | Validate per environment and avoid hard-coding a single backend |
| Integration tests run after deploy, not in pull-request CI | Integration runs hermetically before deploy, on `main` and later on pull requests | Post-deploy detection is too late, and RLS is verifiable without production |
| No multi-environment promotion | Local stack for RLS; no staging environment | The local stack gives full RLS fidelity at no cost; only the bridge needs production |

## Risks / Trade-offs

- **The identity bridge is not covered before deploy** → it is verified immediately after deploy by the smoke; keep the smoke minimal and pair it with failure alerting.
- **The smoke and the authenticated flow exercise production** → they use disposable identities, remove the application data they create, and the smoke deletes its user.
- **The authenticated end-to-end flow can accumulate Firebase users** → it uses unique addresses; the smoke cleans up, and cleaning up the authenticated flow's users is a tracked follow-up.
- **Local PostgREST token minting is coupled to the local JWT secret** → the secret is the documented local default; tests read it from the stack, not from a hard-coded production value.
- **Docker adds CI time and cost** → acceptable; local Postgres is the highest-fidelity, lowest-cost option. No always-on resources are introduced.
- **Coverage threshold could fail immediately** → start at the measured baseline and ratchet rather than picking an arbitrary number.
- **Google popup sign-in remains untested** → accepted limitation; email/password covers the bridge.

## Migration Plan

Incremental and trunk-based. Order:

1. Spike: determine whether the local stack verifies third-party Firebase tokens, and pick the local identity approach. (Done: it does not; use locally-minted tokens.)
2. Introduce environment-driven config without changing production behavior (defaults unchanged).
3. Add the local-stack scripts and rewrite the integration suite with minted tokens; confirm it passes locally and in CI before deploy.
4. Serve the production static build for end-to-end tests; keep the authenticated flow gated and post-deploy.
5. Add coverage and scanning gates at the measured baseline.
6. Restructure the pipeline: required checks, migration step behind the protected environment, deploy, smoke.

Rollback: redeploy the previous static build via the pipeline. Migrations are forward-only, so a schema rollback is a new migration, not a revert.

## Open Questions

None. The decision gate is resolved: the local stack does not verify third-party Firebase tokens, so integration uses minted tokens and the bridge is verified by the post-deploy smoke.
