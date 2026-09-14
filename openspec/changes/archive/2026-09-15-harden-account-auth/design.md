## Context

See `proposal.md` — Why.

Current state:

- Sign-in (`app/sign-in/page.tsx`) offers email/password and Google. `handleGoogle` catches every error and shows `error.message`, so a collision surfaces as raw Firebase text.
- `lib/account.ts` has `unlinkGoogle` and `setPassword` (which links a password to a provider-only account), but no way to link Google to a password account.
- The project has one-account-per-email and improved email privacy enabled.
- Passwords require six characters, checked only in the browser; no Identity Platform password policy is set (the default minimum is six).
- The account page renders settings as Metronic `SettingRow`s.

## Goals / Non-Goals

**Goals:**

- Turn the Google sign-in collision into a successful sign-in with Google linked.
- Let a password account link Google from the account page.
- Enforce an eight-character minimum on both the client and the server.

**Non-Goals:**

- No additional identity providers, avatar uploads, session management or App Check.
- No forced password upgrade for existing accounts.
- No change to the Supabase data model or RLS.

## Decisions

### Resolve the collision by linking, not by relaxing one-account-per-email

**Why:** Firebase's one-account-per-email prevents duplicate accounts for the same address, which is the safer default. The fix belongs in the app: detect the collision and complete the link. **Alternative — disable one-account-per-email:** would allow two accounts for one address, producing confusing, split data.

### Complete the link from the sign-in page with a password prompt

**Why:** The pending Google credential only exists inside the error handler, so recovery has to happen there. The standard Firebase flow is: sign in with the existing method, then link the pending credential. The user is shown the email from `error.email` and asked for its password. **Alternative — send the user away to sign in manually:** loses the pending credential and forces a second Google round-trip.

### Link Google from the account page as well

**Why:** Symmetry with the existing unlink, and it lets a user link proactively rather than only when they hit the collision. Requires re-authentication, like the other sensitive actions.

### Password minimum of eight, enforced in the client and on the server

**Why:** A client-only minimum is cosmetic; anyone can call the API directly. Identity Platform password policy enforces it server-side. `forceUpgradeOnSignin` is left `false` so an existing account with a shorter password is never locked out; only new or changed passwords must comply. **Alternative — client only:** leaves the API open to six-character passwords.

## Risks / Trade-offs

- **`linkWithCredential` can fail** with `credential-already-in-use` (the Google account is already linked elsewhere) or `provider-already-linked` → mapped to clear messages instead of raw Firebase text.
- **Recovery assumes the existing account has a password** → true in practice: a Google-only account does not collide on Google sign-in, so the colliding account is a password account.
- **The reverse collision (sign-up with an email that already has a Google account) is hidden by email privacy protection** → the error is generic; a "try signing in with Google" hint is added only if the error is distinguishable.
- **The password policy rejects short passwords on reset or set for existing accounts** → intended; the requirement is stated in the UI.
- **Enabling the password policy is a live project change** → applied deliberately and verified against the live backend, with `forceUpgradeOnSignin: false` to avoid lock-outs.

## Migration Plan

1. Add the spec deltas to `authentication` and `account`.
2. Add `linkGoogle` and the collision helpers to `lib/account.ts`.
3. Add the collision recovery step to the sign-in page.
4. Add the link action to the account page.
5. Raise the client minimum to eight characters and update the tests.
6. Apply the Identity Platform password policy.
7. Run `npm run verify`, the end-to-end suite and `openspec validate --strict`.

## Deferred: App Check

App Check attests that requests come from the genuine app, using reCAPTCHA Enterprise (invisible, score-based) on web, and rejects unverified requests once enforcement is enabled per service. It covers **Firebase Authentication (Preview), Firebase AI Logic, Firestore, Storage, callable Functions and Google services — but not Supabase**, so it cannot protect the `packmate` data layer; RLS remains the authorization boundary there. It is free for 10,000 reCAPTCHA Enterprise assessments per month, and localhost/CI need a registered debug token (our integration tests call the Identity Toolkit REST API directly and would otherwise be rejected).

**Revisit when** automated sign-up or password-reset abuse appears, or when Firebase AI Logic ships. Not part of this change.

## Open Questions

<!-- None. -->
