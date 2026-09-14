## Context

See `proposal.md` — Why.

Current state:

- Identity is Firebase Auth; Supabase trusts the Firebase ID token via third-party auth and every `packmate` row is owned by `user_id = auth.jwt()->>'sub'`. Changing email therefore does not move any data.
- The authenticated app runs inside the ported Metronic shell (`app/(app)/layout.tsx` → `AppShell`); pages use `PageHeader` and the `components/ui/` primitives. There is no account route, and the topbar "Profile" item is unwired.
- `components/auth-provider.tsx` exposes only sign in/up, Google, and sign out; `app/sign-in/page.tsx` does a single-step sign-in.
- The licensed Metronic template contains the account design (`account/home/user-profile`, `account/home/settings-sidebar`) but is not committed; `reference/` holds only the starter kit and landing.
- The app is a static export (`output: 'export'`), client-rendered behind auth, with no custom backend.

## Goals / Non-Goals

**Goals:**

- One account page that covers profile, account security and data.
- Keep identity uid-based so no data migration is needed for email changes.
- Add two-factor authentication without introducing SMS cost or a backend.

**Non-Goals:**

- No two-page profile/settings split and no scrollspy settings page.
- No SMS second factor.
- No avatar or file uploads (Firebase Storage / egress).
- No enterprise account features (members, roles, billing, SSO, API keys, integrations, address).
- No Cloud Functions or other new infrastructure.
- No public/social profile.

## Decisions

### Single account page built from the Metronic profile cards

**Why:** The Metronic profile page is a card grid (`PersonalInfo`, `BasicSettings`); most of its cards are enterprise/social and are dropped. What remains maps directly to the three areas requested — profile, account, data — and stays simple on mobile. **Alternative — Metronic's two-page model (profile overview + scrollspy settings):** more faithful to the template but a denser surface that the product principles discourage.

### New `packmate.profiles` table as the source of truth

**Why:** Firebase only stores `displayName`; birthday and gender have no home. A relational table fits the existing model and RLS pattern (`user_id` defaulting to the Firebase subject claim). **Alternative — Firebase `displayName` only:** cannot store birthday or gender. **Alternative — Firebase custom claims:** wrong tool for mutable profile data and inflates tokens.

Fields: `user_id text primary key`, `display_name text`, `birthday date`, `gender text`, `created_at`, `updated_at`, all optional except the key. Gender is a small constrained set (female, male, other, prefer not to say) enforced by a check constraint.

### TOTP-only second factor

**Why:** Firebase supports TOTP and SMS. TOTP is free; SMS incurs per-message cost, needs reCAPTCHA and a region allowlist, and conflicts with the cost principle. **Alternative — SMS:** rejected on cost.

### Auth pages share one Metronic-branded layout

**Why:** The template ships a `(auth)` route group with a branded split layout (card on one side, branding panel on the other) and dedicated sign-in, sign-up, reset-password and verify-email pages. Pack Mate already had a hand-built split layout on the sign-in page. That layout is extracted into a shared `AuthLayout`, and the reset password flow becomes its own `/reset-password` route following the template's reset-password structure (centred heading, email, submit, back to sign-in) instead of an inline mode on the sign-in card.

**Alternative — keep the reset flow inline on sign-in:** less routing, but it diverges from the template and cannot carry the branded layout. **Adaptation:** the template's reCAPTCHA popover and NextAuth API routes are dropped; the page calls Firebase directly.

### Email verification is soft, not an onboarding gate

**Why:** Firebase requires a verified email before a second factor can be enrolled. Rather than blocking onboarding — which costs conversion — or building a full verification flow, the app sends a verification message on sign-up, shows the status with a resend action on the account page, and requires verification only for enrolling a second factor. Unverified users keep full access.

**Alternative — hard gate (block unverified users):** stronger anti-abuse, but real friction and a locked state; deferred until abuse is demonstrated. The product has no public surface, no messaging and no per-user cost, so spam accounts have little to exploit.

**Note:** changing email already proves the new address through `verifyBeforeUpdateEmail`, so it needs no additional gate; requiring the *current* address to be verified would trap users who typo'd it.

### Sign-in gains a multi-factor step

**Why:** Enrolling MFA makes `signInWithEmailAndPassword` reject with `auth/multi-factor-auth-required`. `components/auth-provider.tsx` and `app/sign-in/page.tsx` must resolve the second factor via `getMultiFactorResolver` before the session is established. This is the one cross-cutting change to existing behavior.

**Verification spike (must pass before MFA is enabled for real):** confirm a multi-factor-resolved Firebase ID token still satisfies Supabase third-party auth and still carries the `role: authenticated` claim from the `beforeUserSignedIn` blocking function.

### Email change via verification link

**Why:** `verifyBeforeUpdateEmail` only applies the new address after the user clicks a link, avoiding typo lock-outs and unverified addresses. **Alternative — immediate `updateEmail`:** faster but riskier; requires recent login either way.

### Google unlink guarded by the presence of a password

**Why:** Firebase does not prevent unlinking the last provider, so the app must. The account page offers Unlink only when a password credential exists; a Google-only account is told to set a password first. Google sign-in stays available on `/sign-in`.

### Account deletion performed client-side, data before auth

**Why:** No backend exists and adding a Function is unnecessary. The client deletes its own rows (RLS permits it), then calls `deleteUser`. Deleting `trips`, `reusable_bags` and `reusable_items` cascades to the remaining tables. Ordering data-first means a failed data delete leaves the auth account intact so the user can retry, avoiding orphaned rows. `deleteUser` requires recent login, so re-authentication is part of the flow. **Alternative — Cloud Function with the Admin SDK:** more robust against a client dying mid-flow but adds infrastructure and cost; revisit only if needed.

### Export as a versioned JSON download

**Why:** A client-side read of the six tables plus the profile, assembled into `{ schemaVersion, exportedAt, ... }` and downloaded as a blob. Cheap, no backend. **Alternative — CSV:** deferred.

### Initials avatar

**Why:** Firebase `photoURL` is unavailable for password accounts and image uploads need Storage plus egress. Initials already exist in the topbar.

### Reuse Metronic primitives; port only what is missing

**Why:** The design must match Metronic. `components/ui/` lacks `switch` and a date picker; the birthday field can use a native date input to avoid porting the calendar, and the `switch` primitive is ported from the template if needed. No new dependencies.

## Risks / Trade-offs

- **Lost authenticator locks a user out permanently** → accepted for MVP with no backend; warn at enrollment and advise adding the secret to a backup authenticator app. Revisit with a recovery flow if it becomes a support burden.
- **MFA token may not satisfy Supabase third-party auth** → verify with the spike above before enabling; if it fails, MFA is blocked and must be re-designed.
- **Client-side deletion interrupted between data and auth** → ordering makes partial failure safe (data first, auth last); the user retries.
- **Email-change verification may land in spam** → surface clear status and allow resend.
- **Profile RLS omission would leak data** → add policies in the same migration and cover with a second-user integration test.
- **Reference not present in CI** → this design and the specs capture the intent so implementation does not depend on the local template.

## Migration Plan

1. Add the `packmate.profiles` migration with RLS and apply it through the existing Supabase workflow.
2. Add the profile data layer and validation, with unit tests.
3. Build the account page (profile, account, data cards) and wire the topbar entry.
4. Add the auth operations (email, password, TOTP enrollment, unlink) and the multi-factor sign-in step; run the compatibility spike.
5. Add export and client-side deletion.
6. Add integration (RLS) and end-to-end coverage; run `npm run verify`.
7. Deploy through the existing CI pipeline. Rollback is redeploying the previous build; the `profiles` table is additive and unused by existing features, so it can remain.

## Verification spike (TOTP + Supabase)

Task 5.1. **Status: passed.**

TOTP was enabled on `pack-mate-37305` through the Identity Platform admin API (`mfa.state = ENABLED`, `totpProviderConfig.state = ENABLED`, `adjacentIntervals = 5`); the Firebase Console only exposes SMS.

Result against the live backend:

- TOTP enrollment succeeds; password sign-in returns an `mfaPendingCredential`; `accounts/mfaSignIn:finalize` returns an ID token whose claims include `sub` (the Firebase uid), `role: authenticated`, and `firebase.sign_in_second_factor: totp`.
- Supabase accepted that token for a `packmate` read (`200`). Multi-factor sign-in is compatible with the existing third-party-auth setup and the `beforeUserSignedIn` blocking function.

Findings that affect the design:

- **A verified email is required before enrolling a second factor.** Firebase rejects enrollment with `UNVERIFIED_EMAIL` for an account whose email is unverified. The app has no email-verification step, so a password user who has not verified their email cannot enable 2FA. This is not covered by the current specs and needs a decision — either block enrollment with a "verify your email first" action, or add email verification.
- TOTP rejects a code that has already been used (replay protection). A user naturally receives a fresh code, so this only affects automated reuse.

## Open Questions

- Exact minimum password length and the final gender option labels — UI-level details that do not change the approach.
