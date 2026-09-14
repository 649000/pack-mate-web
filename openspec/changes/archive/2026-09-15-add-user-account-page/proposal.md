## Why

Users can sign in but cannot manage their identity: there is no profile (name, birthday, gender), no way to change email or password, no second factor, no way to unlink Google, no data export, and no way to delete an account. A consumer product needs an account page so users can control their own profile, security and data.

## What Changes

- Add an account page at `/account`, reachable from the existing topbar "Profile" menu item, following the Metronic account/profile card design (personal info, account, data) and stacking to one column on mobile.
- Personal info: optional name, birthday and gender, stored in a new `packmate.profiles` table (Supabase, RLS-scoped by the Firebase subject claim).
- Change email using a verification link sent to the new address; change password after re-authentication, or set a password for Google-only accounts.
- Enroll and manage **TOTP** two-factor authentication (authenticator app, free), and support the multi-factor sign-in step that enrollment introduces.
- Verify the email address: send a verification message on sign-up, show verified status on the account page, allow a resend, and require a verified email before enrolling a second factor. Unverified users keep full access.
- Let a user request a password reset from the sign-in page, without disclosing whether an address has an account.
- Unlink Google from an account, offered only when a password exists (otherwise the account would be orphaned).
- Export all of the user's data as a versioned JSON download.
- Delete the account: remove the user's Supabase rows first, then delete the Firebase user.
- Modify authentication so sign-in completes a second factor when the user has MFA enrolled.

## Capabilities

### New Capabilities

- `account`: a signed-in user can view and edit their profile, manage their email, password, two-factor authentication and linked sign-in providers, export their data, and delete their account.

### Modified Capabilities

- `authentication`: sign-in must complete a second factor when the user has enrolled in multi-factor authentication; a user can verify their email address (verification message on sign-up, status shown, resendable); and a user can request a password reset from the sign-in page.

## Impact

- **Frontend**: new `app/(app)/account/` route and components; wire `components/layouts/topbar/user-dropdown-menu.tsx`; `components/auth-provider.tsx` and `app/sign-in/page.tsx` gain the multi-factor step.
- **Data**: new Supabase migration adding `packmate.profiles` with RLS; data export reads the existing `packmate` tables plus the profile.
- **Authentication**: Firebase Auth operations — `verifyBeforeUpdateEmail`, `updatePassword`, `linkWithCredential`/`unlink`, TOTP MFA enrollment, `deleteUser` — each requiring re-authentication where Firebase demands a recent login.
- **Backend**: none. No Cloud Functions, no new services, no new recurring cost.
- **Tests**: unit tests for profile validation and export shape; integration test that a second user cannot read or write another user's profile row (RLS); end-to-end coverage of the account flows.
- **Design source**: the Metronic account design lives only in the licensed template, which is not committed; this change captures the intent so implementation does not depend on the local reference.
