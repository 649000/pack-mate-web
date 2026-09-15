## 1. Database

- [x] 1.1 Add `supabase/migrations/20260915010000_item_weight.sql` adding nullable `weight_grams` to `packmate.reusable_items` and `packmate.trip_entries`, nullable `weight_limit_grams` to `packmate.reusable_bags` and `packmate.trip_bags`, and `weight_unit text not null default 'kg'` to `packmate.profiles`, with non-negative and unit checks; verify the migration applies cleanly to a local Supabase instance
- [x] 1.2 Update `packmate.add_library_item_to_trip` to copy `weight_grams`; verify by adding a weighted item to a trip and reading the entry
- [x] 1.3 Update `packmate.add_library_bag_to_trip` to copy `weight_grams` for entries and `weight_limit_grams` for the bag; verify by adding a bag with a limit and weighted default contents

## 2. Weight module

- [x] 2.1 Add `lib/weight.ts` with `toGrams`, `fromGrams`, and `formatWeight` covering g, kg, oz, and lb; verify unit tests in `lib/weight.test.ts`
- [x] 2.2 Add aggregation helpers `sumEntryWeight`, `sumBagWeight`, `tripBaggageTotal`, `isOverLimit`, and `isWeightComplete` to `lib/weight.ts`; verify unit tests cover quantity multiplication, exclusion of With Me and unassigned entries, limit states, and incomplete totals

## 3. Types, validation, data access

- [x] 3.1 Add `weight_grams` to `ReusableItem` and `TripEntry`, `weight_limit_grams` to `ReusableBag` and `TripBag`, and `weight_unit` to `UserProfile` in `lib/types.ts`; verify with `npm run typecheck`
- [x] 3.2 Add `validateWeight`, `validateWeightLimit`, and `validateWeightUnit` to `lib/validation.ts`, rejecting negative, non-numeric, and excessive values and unknown units; verify unit tests in `lib/validation.test.ts`
- [x] 3.3 Extend `lib/data.ts`: item create/update accept weight, bag create/update accept a limit, entry update accepts weight, and `upsertProfile` accepts `weight_unit`; verify via `lib/data.test.ts`

## 4. UI

- [x] 4.1 Add a weight input in the user's preferred unit to create and edit in `app/(app)/items/page.tsx`; verify with `app/(app)/items/page.test.tsx`
- [x] 4.2 Add a default weight limit input to `app/(app)/bags/page.tsx`; verify with `app/(app)/bags/page.test.tsx`
- [x] 4.3 Show each trip bag's weight against its limit, the trip's total baggage weight, and the unit toggle in `app/(app)/trip/page.tsx`; verify with `app/(app)/trip/page.test.tsx`
- [x] 4.4 Add a weight-unit preference to `app/(app)/account/page.tsx`; verify with `app/(app)/account/page.test.tsx`

## 5. Verification

- [x] 5.1 Extend `tests/integration/rls.test.ts` to assert that weight and bag limit copy onto a trip and that a second user cannot read them
- [x] 5.2 Extend the authenticated e2e spec to set an item weight and a bag limit and confirm the trip shows the bag total and limit state
- [x] 5.3 Run `npm run verify` and confirm typecheck, lint, format, unit tests, build, and bundle checks pass
