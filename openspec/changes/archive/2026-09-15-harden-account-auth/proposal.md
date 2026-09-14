## Why

Signing in with Google dead-ends when the email already belongs to a password account: Firebase rejects the collision with `auth/account-exists-with-different-credential` and the app surfaces the raw error, with no way to recover or to link Google afterwards. Separately, passwords only need six characters and that minimum is enforced in the browser alone.

## What Changes

- Resolve the sign-in collision: when Google sign-in fails because the email already has an account, sign in with the existing password and link the pending Google credential, so the user ends up signed in with Google linked.
- Let a password account link Google from the account page, symmetric to the existing unlink.
- Raise the minimum password length to 8, enforced by the Identity Platform password policy as well as in the client.

## Capabilities

### New Capabilities

<!-- None. -->

### Modified Capabilities

- `authentication`: sign-in resolves an existing-email collision by linking the pending provider; passwords must be at least 8 characters.
- `account`: a user can link Google to their account.

## Impact

- **Frontend**: `app/sign-in/page.tsx` (collision recovery), `components/account/account-card.tsx` and a new link dialog, `lib/account.ts` (`linkGoogle` and collision helpers), `lib/validation.ts` (minimum length).
- **Auth configuration**: Identity Platform password policy set to enforce a minimum length of 8 without forcing existing users to upgrade.
- **Tests**: unit tests for linking and the password boundary, page tests for the collision step and the link action, and a public end-to-end test for the minimum length. The live integration test is unaffected (it uses longer passwords).
- **Deferred**: App Check, tracked in `design.md` — it covers Firebase Authentication and AI Logic but not the Supabase data layer.
