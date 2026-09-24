## Why

The authenticated end-to-end suite signs up a fresh disposable Firebase user for every test (~20 per run) against the deployed backend. Firebase Auth enforces a per-IP quota on account creation; once it trips, `accounts:signUp` answers `400 TOO_MANY_ATTEMPTS_TRY_LATER` (the Firebase JS SDK reports it as `auth/too-many-requests`) and keeps blocking sign-ups from that IP for several minutes. Every test then stalls in the `signUp` helper and fails at `expect(page).toHaveURL(/\/dashboard$/)`.

Reproduced on 2026-09-24: one run passed (20/20), and consecutive runs immediately after failed 9/20, 5/20 and 6/20, every failure at the same `signUp` assertion. A live probe confirmed the wire error:

```
400 POST identitytoolkit.googleapis.com/v1/accounts:signUp
{ "error": { "message": "TOO_MANY_ATTEMPTS_TRY_LATER", "reason": "invalid" } }
```

A single sign-up still failed roughly four minutes later, so the block outlasts a run and cannot be waited out inside one. The failure currently reads like an app regression (a navigation timeout) rather than an external quota, which is misleading.

## What Changes

- Make the e2e `signUp` helper detect the identity provider's per-IP throttle and fail fast with a message that names the cause, instead of a generic `/dashboard` URL timeout.
- Record the quota constraint and the supported operating model in the `automated-testing` spec: live authenticated end-to-end runs create disposable identities, are quota-sensitive, and are expected to run once per deploy from a fresh CI runner, not repeatedly from one IP.

## Capabilities

### New Capabilities

<!-- None. -->

### Modified Capabilities

- `automated-testing`: the `Test environments are isolated from production` requirement gains the expectation that a throttled live sign-up is reported clearly, and documents that the authenticated flow's per-test disposable identities are subject to the identity provider's per-IP quota.

## Impact

- `e2e/authenticated.spec.ts` — the `signUp` helper detects and reports the throttle.
- `openspec/specs/automated-testing/spec.md` — gains the clarified scenario via this change's delta.
- No application code, dependencies, or CI secrets change. No test coverage is removed.
