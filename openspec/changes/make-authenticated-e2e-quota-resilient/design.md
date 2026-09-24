## Context

The identity bridge (Firebase Auth → auth blocking function → Supabase RLS) cannot be exercised locally: the local Supabase stack rejects real Firebase tokens and the Firebase Auth emulator cannot be accepted either. The only faithful check is a real sign-up against the deployed backend. See `openspec/changes/archive/2026-09-17-harden-test-and-delivery-pipeline/design.md`.

Because of that, the authenticated end-to-end suite is the only test that creates Firebase identities, and it creates one per test. Firebase Auth applies a per-IP quota to account creation; when exceeded it returns `TOO_MANY_ATTEMPTS_TRY_LATER` and blocks the IP for minutes. The current `signUp` helper reacts by waiting for `/dashboard` and timing out, hiding the cause.

The archived design already anticipated account accumulation ("The authenticated end-to-end flow can accumulate Firebase users … cleaning up the authenticated flow's users is a tracked follow-up") but did not address throttling or the per-run account count.

## Goals / Non-Goals

**Goals:**

- Make a throttled live sign-up fail with an actionable message that names the identity provider's quota.
- Keep the authenticated suite's per-test isolation and existing coverage.
- Document the supported operating model so a throttled run is not mistaken for an app regression.

**Non-Goals:**

- Bypassing or raising the identity provider's quota.
- Provisioning test identities through the Firebase Admin API or a service account (adds secrets and diverges from the client sign-up the bridge actually uses).
- Sharing one account across tests via `storageState` (per-test empty-state assertions require isolated accounts).
- Merging or reducing the authenticated scenarios.

## Decisions

### Detect the throttle on the wire and fail fast

- **Why:** the response body identifies the cause unambiguously; surfacing it turns a misleading navigation timeout into a one-line diagnosis. Waiting the full assertion timeout per test also makes a hard block slow and noisy.
- **How:** the `signUp` helper watches for the `accounts:signUp` response and, when the sign-up does not reach `/dashboard`, inspects that response for `TOO_MANY_ATTEMPTS_TRY_LATER` and throws a message explaining the per-IP quota and the supported operating model.
- **Alternative — retry with backoff:** rejected. The block persists for minutes, longer than any sane in-run backoff, and further sign-up attempts during an abuse block risk extending it. Retrying would only delay the same failure and prolong the block.
- **Alternative — serialize the suite (`workers: 1`):** rejected as a fix. The observed block follows cumulative volume, not a single burst (a 7-worker run passed); serializing would slow the post-deploy job without removing the quota.

### Keep per-test accounts and document the operating model

- **Why:** the suite's value is isolated scenarios, and several assert empty states (no trips, bags, items or shares) that a shared account cannot provide. The quota is external and cannot be engineered away without Admin credentials.
- **Consequence:** the authenticated flow is quota-sensitive by design. It is expected to run once per deploy from a fresh CI runner; repeated runs from one IP will be throttled. This is recorded in the `automated-testing` delta spec.

## Risks / Trade-offs

- **A hard-throttled IP still fails the whole run** → the failure now names the quota and is fast; the supported path is CI (fresh runner, once per deploy) or waiting out the block. Accepted.
- **The suite remains capped at roughly one full run per IP per quota window** → accepted; reducing per-run accounts is a larger follow-up (shared accounts or Admin-provisioned identities) and is out of scope here.
- **Network-watch complexity in the helper** → contained to `signUp`, with no behaviour change on success.

## Migration Plan

Single change, no data or deployment migration. Land the helper and the spec delta together; the next post-deploy run exercises it.

## Open Questions

None.
