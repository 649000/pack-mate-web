## 1. Database: share links table

- [x] 1.1 Add a migration creating `packmate.share_links` with `id`, `trip_id` (references `packmate.trips` on delete cascade), `user_id` defaulting to the JWT `sub` claim, a unique `token` generated as 256 bits of randomness, `created_at`, `expires_at` (nullable) and `revoked_at` (nullable); verify the migration applies cleanly to a local Supabase project and the table exists with a 64-character hex default token
- [x] 1.2 Add owner-only RLS policies for select, insert, update and delete on `share_links`, and indexes on `trip_id` and `user_id` plus a partial unique index on `(trip_id) where revoked_at is null`; verify a second user cannot select, update or delete another user's row and that a second active link for the same trip is rejected

## 2. Database: public read function

- [x] 2.1 Add `packmate.get_shared_trip(p_token text)` as `security definer` with a fixed `search_path` and no dynamic SQL, returning a single `jsonb` projection: trip name and dates, bags with nesting, and entries with name, quantity, packed state, location, description, link, image URL and weight, plus per-bag weight and limit; verify against a seeded trip that the returned document contains the expected bags and entries and no `user_id`, `source_item_id` or `source_bag_id`
- [x] 2.2 Make the function require an active, unexpired token and short-circuit to `null` when there is no match; verify it returns `null` for an unknown token, a revoked token, an expired token and a token whose trip was deleted
- [x] 2.3 Revoke execute from `public` and grant execute to `anon` and `authenticated` only; verify an anonymous caller can execute the function while no anonymous table grants exist on `share_links`, `trips`, `trip_bags` or `trip_entries`

## 3. Data layer and types

- [x] 3.1 Add `ShareLink` to `lib/types.ts` and add `createShareLink`, `listShareLinks`, `revokeShareLink`, `regenerateShareLink` and `getSharedTrip(token)` to `lib/data.ts`; verify `npm run typecheck` passes
- [x] 3.2 Add a share URL builder and a token validator to `lib/validation.ts` (or a share helper module) and cover them with unit tests; verify `npm test` passes
- [x] 3.3 Add share-link handling to `collectUserData` and the `ExportedData` type; verify the export unit test includes share links and `npm test` passes

## 4. Public shared view

- [x] 4.1 Extract a read-only packing-list presentational component that reuses `buildBagTree`, `groupEntries`, `packingProgress` and `entryLocationPath` from `lib/packing.ts` and renders trip details, nested bags, With Me, unassigned entries, progress, weights and bag limits; verify a component test covers a populated list, nested bags and an empty list
- [x] 4.2 Add the public `/share` page reading `?t=`, mounted outside `RequireAuth`, that fetches on load, offers a manual refresh, and renders loading, unavailable and empty states; verify a page test covers a valid token, an unavailable token and a refresh that picks up changed data
- [x] 4.3 Ensure the shared page is read-only (no mutation controls) and that an unauthenticated visitor can load it; verify with an end-to-end test that opens the link in a fresh anonymous context

## 5. Shared links management

- [x] 5.1 Add the `/shares` page listing the user's links with trip name, created date, expiry and active or revoked status, with copy, regenerate and revoke actions and an empty state; verify a page test covers listing, copy, regenerate, revoke and the empty state
- [x] 5.2 Add a Shared Links entry to the signed-in navigation; verify the navigation test reaches `/shares`

## 6. Share from a trip

- [x] 6.1 Add a Share action to the trip page that creates or returns the trip's link and lets the owner copy it; verify a page test covers creating and copying a link

## 7. Security headers and link hygiene

- [x] 7.1 Add `noindex, nofollow` and a `no-referrer` referrer policy to the shared page and `rel="noopener noreferrer"` to external item links; verify the built share page contains the robots and referrer directives and an end-to-end check confirms no referrer is sent

## 8. Integration and end-to-end verification

- [x] 8.1 Extend `tests/integration/rls.test.ts` to prove an anonymous client cannot read the base tables directly, that `get_shared_trip` returns the projection only for a valid active token, and that a second user cannot copy, regenerate or revoke another user's link; verify `npm run test:integration` passes
- [x] 8.2 Add an end-to-end test: owner creates a share link, an anonymous context views it, the owner packs an entry, a refresh shows the change, the owner revokes, and the link then shows the unavailable state; verify `npm run test:e2e` passes
- [x] 8.3 Run the full verification suite; verify `npm run verify:all` passes
