## 1. Data foundation

- [x] 1.1 Add a `packmate.profiles` migration (table with `user_id` primary key defaulting to `auth.jwt()->>'sub'`, optional `display_name`, `birthday`, `gender`, a gender check constraint, timestamps) plus RLS select/insert/update/delete policies scoped to the subject claim, and apply it; verify the table and policies exist.
- [x] 1.2 Add profile types to `lib/types.ts` and profile data access (`getProfile`, `upsertProfile`) in `lib/data.ts`; verify a unit test round-trips a valid upsert.
- [x] 1.3 Add profile validation (name length, birthday not in the future, gender in the allowed set) to `lib/validation.ts`; verify unit tests cover valid and invalid inputs.
- [x] 1.4 Add an integration test proving a second user cannot read or write another user's profile row; verify it fails without the RLS policies and passes with them.

## 2. Account page shell

- [x] 2.1 Create `app/(app)/account/page.tsx` rendering the profile, account and data cards, single-column on mobile; verify it renders behind auth and is reachable at `/account`.
- [x] 2.2 Wire the "Profile" item in `components/layouts/topbar/user-dropdown-menu.tsx` to `/account` and remove the dead "Preferences" item; verify selecting it opens the account page.
- [x] 2.3 Port the Metronic `switch` primitive (and any other missing primitive the cards need) into `components/ui/`; verify `npm run typecheck` and `npm run lint` pass.

## 3. Profile management

- [x] 3.1 Implement the Personal Info card with optional name, birthday and gender saving through `upsertProfile`; verify saving and clearing each field persists and shows a success toast.
- [x] 3.2 Show an empty state with an initials avatar when no profile exists; verify a new user sees empty fields without errors.

## 4. Email and password

- [x] 4.1 Implement change email with `verifyBeforeUpdateEmail` and email validation; verify a valid submission triggers a verification message and an invalid one shows an error.
- [x] 4.2 Implement change password (re-authenticate, then `updatePassword`) with minimum-length validation; verify the happy path and the re-authentication-required path.
- [x] 4.3 Implement "set password" for accounts with no password credential using `linkWithCredential`; verify a Google-only account can subsequently sign in with email and password.

## 5. Two-factor authentication

- [x] 5.1 Run the compatibility spike: confirm a multi-factor-resolved Firebase ID token is accepted by Supabase and carries `role: authenticated`, and record the outcome in `design.md` before enabling enrollment.
- [x] 5.2 Implement TOTP enrollment (re-authenticate, present the secret/QR, verify a code, enroll) and display enrollment status; verify a valid code enables 2FA and an invalid code does not.
- [x] 5.3 Implement removal of the enrolled second factor; verify the status returns to disabled.
- [x] 5.4 Handle `auth/multi-factor-auth-required` in `components/auth-provider.tsx` and add the second-factor step to `app/sign-in/page.tsx`; verify an enrolled user must complete the second factor to sign in.

## 6. Google unlink

- [x] 6.1 Add a "Sign-in with" row showing the linked Google provider with an Unlink action enabled only when a password credential exists; verify unlink succeeds for a password account.
- [x] 6.2 Block unlink for a Google-only account with a "set a password first" message; verify the attempt is prevented.

## 7. Data export

- [x] 7.1 Implement a versioned JSON export of the profile and all six `packmate` tables as a file download; verify the file parses and contains only the current user's data.
- [x] 7.2 Verify an export with no trips, bags or items still produces a valid file containing the profile.

## 8. Account deletion

- [x] 8.1 Implement deletion with a confirmation dialog and re-authentication, removing trips, reusable bags and reusable items before calling `deleteUser`; verify a deleted account's data and authentication record are gone.
- [x] 8.2 Verify that when data deletion fails the authentication account is not deleted and an error is shown.

## 9. Verification

- [x] 9.1 Add end-to-end coverage for the account flows (profile save, email/password, 2FA sign-in, unlink, export, delete); verify `npm run test:e2e` passes.
- [x] 9.2 Run `npm run verify` and confirm typecheck, lint, format check, unit tests, build and bundle check all pass.

## 10. Email verification (added during implementation)

- [x] 10.1 Add spec requirements for email verification and the two-factor gate to `authentication` and `account`.
- [x] 10.2 Send a verification message when an email and password account is created; verify with unit tests for the send/refresh helpers.
- [x] 10.3 Show verified status and a resend action on the account page; verify with the page test and a screenshot.
- [x] 10.4 Require a verified email before enrolling a second factor and offer to send the link; verify the gate appears for an unverified user.

## 11. Password reset (added during implementation)

- [x] 11.1 Add the password reset requirement to the `authentication` spec.
- [x] 11.2 Add `sendPasswordReset` with email validation; verify with unit tests for a valid and an invalid address.
- [x] 11.3 Extract the Metronic branded auth layout and add a `/reset-password` page (centred heading, email, submit, back to sign-in), linked from "Forgot password?" on sign-in; verify with page tests, a public end-to-end test and a screenshot.
