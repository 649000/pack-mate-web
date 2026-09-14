## 1. Specification

- [x] 1.1 Add spec deltas to `authentication` (collision linking, password minimum) and `account` (link Google); verify `openspec validate harden-account-auth --strict` passes.

## 2. Account linking

- [x] 2.1 Add `linkGoogle` and the collision helpers (`isAccountExistsError`, `pendingCredentialFrom`, `linkPendingCredential`) to `lib/account.ts`; verify unit tests cover a successful link, an already-linked provider, and a credential already in use.
- [x] 2.2 Add the collision recovery step to the sign-in page: on `account-exists-with-different-credential`, ask for the existing password, sign in, link the pending credential and continue; verify a page test drives the step.
- [x] 2.3 Add a "Link Google" action to the account page's Sign-in-with row when Google is not linked; verify a page test and that the dialog requires re-authentication.

## 3. Password minimum

- [x] 3.1 Raise the client minimum to 8 characters with a hint in the sign-in and change-password forms; verify unit tests reject 7 and accept 8.
- [x] 3.2 Apply the Identity Platform password policy (minimum length 8, enforce, no forced upgrade); verify the live service rejects a 7-character password.

## 4. Verification

- [x] 4.1 Add a public end-to-end test that a short password is rejected; verify `npm run test:e2e` passes.
- [x] 4.2 Run `npm run verify` and `openspec validate harden-account-auth --strict`.
