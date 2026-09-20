## 1. Database

- [x] 1.1 Add `supabase/migrations/20260921000000_duplicate_trip.sql` creating `packmate.duplicate_trip(p_source_trip_id uuid, p_name text, p_country_code text, p_destination text, p_start_date date, p_end_date date)` as `security invoker`, asserting the caller owns the source trip, inserting the new trip, copying `trip_bags` with a two-pass `parent_bag_id` remap, and copying `trip_entries` with `is_packed = false`; grant execute to `authenticated`; verify the migration applies cleanly with `npm run supabase:reset`
- [x] 1.2 Verify by direct SQL that duplicating a trip with nested bags reproduces the nesting, copies entry metadata, and leaves every copied entry unpacked
- [x] 1.3 Verify the function raises when the source trip belongs to another user

## 2. Data layer

- [x] 2.1 Add `duplicateTrip(sourceTripId, input)` to `lib/data.ts` that validates the trip fields with `validateTrip` and calls the `duplicate_trip` RPC, returning the new trip; verify with `lib/data.test.ts`
- [x] 2.2 Add a helper that derives the duplicate prompt's initial values (name, country and destination prefilled from the source; dates empty) and verify unit tests cover a source trip with and without dates

## 3. UI

- [x] 3.1 Add a Duplicate row action on the trips list that opens the trip editor prefilled for duplication and creates the copy on submit; verify with `app/(app)/trips/page.test.tsx`
- [x] 3.2 Add a Duplicate action to the trip page header that duplicates the trip and navigates to the new trip; verify with `app/(app)/trip/page.test.tsx`
- [x] 3.3 Verify cancelling the prompt creates no trip and validation errors surface as a toast; verify with component tests

## 4. Verification

- [x] 4.1 Extend `tests/integration/rls.test.ts` to assert a second user cannot duplicate another user's trip
- [x] 4.2 Extend `e2e/authenticated.spec.ts` to duplicate a trip and confirm the copy has the same bags and items, all unpacked, with the new trip-level fields
- [x] 4.3 Run `npm run verify` and confirm typecheck, lint, format, unit tests, build and bundle checks pass
