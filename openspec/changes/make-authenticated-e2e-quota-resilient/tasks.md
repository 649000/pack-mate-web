## 1. Report throttled live sign-ups

- [x] 1.1 Update `signUp` in `e2e/authenticated.spec.ts` to watch the `accounts:signUp` response and, when sign-up does not reach `/dashboard`, throw a message naming the identity provider's per-IP account-creation quota (`TOO_MANY_ATTEMPTS_TRY_LATER`) instead of leaving the generic URL-timeout failure; verified against the live throttle, which now reports the quota with the original navigation error attached
- [x] 1.2 Confirm `npm run typecheck` and `npm run lint` pass for the changed spec

## 2. Spec and validation

- [x] 2.1 Add the throttle scenario and the quota operating-model note to the `automated-testing` delta spec; verified `npx openspec validate make-authenticated-e2e-quota-resilient --strict` passes
- [x] 2.2 Run the unauthenticated end-to-end suites and unit/integration tests to confirm no regression (unit 484, integration 30, app+smoke 17); note that a live authenticated run is currently blocked by the external quota and is expected to run once per deploy

## 3. Archive

- [ ] 3.1 After CI confirms the post-deploy authenticated flow, archive the change and sync the `automated-testing` spec
