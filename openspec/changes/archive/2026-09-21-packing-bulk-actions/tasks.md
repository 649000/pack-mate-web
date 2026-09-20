## 1. Database

- [x] 1.1 Add `supabase/migrations/20260921010000_bulk_packed_actions.sql` creating `packmate.set_trip_packed(p_trip_id uuid, p_packed boolean)` as `security invoker`, asserting the caller owns the trip and updating every entry's `is_packed` in one statement; grant execute to `authenticated`; verify the migration applies cleanly with `npm run supabase:reset`
- [x] 1.2 Verify by direct SQL that the function sets every entry's packed state and raises when the trip belongs to another user

## 2. Data layer

- [x] 2.1 Add `setTripPacked(tripId, packed)` to `lib/data.ts` calling the RPC; verify with `lib/data.test.ts`
- [x] 2.2 Add a helper that builds the packed-state snapshot and the inverse update restoring each entry's exact previous value, and verify unit tests cover a mixed packed/unpacked list

## 3. UI

- [x] 3.1 Add Pack all and Unpack all controls to the trip progress card, labelled with the entry count and applying to the whole trip regardless of active search, category or packed filters; verify with `app/(app)/trip/page.test.tsx`
- [x] 3.2 Offer a transient Undo after a bulk action that restores the snapshot, including a mix of previously packed and unpacked entries; verify with component tests
- [x] 3.3 Verify a bulk action changes no entry's quantity, weight, category or location; verify with component tests

## 4. Verification

- [x] 4.1 Extend `tests/integration/rls.test.ts` to assert a second user cannot bulk-change another user's trip
- [x] 4.2 Extend `e2e/authenticated.spec.ts` to pack all, undo, and unpack all on a trip
- [x] 4.3 Run `npm run verify` and confirm typecheck, lint, format, unit tests, build and bundle checks pass
