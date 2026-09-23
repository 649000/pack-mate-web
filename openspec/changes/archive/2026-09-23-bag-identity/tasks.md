## 1. Database

- [x] 1.1 Add `icon` to `reusable_bags` and `trip_bags` with a check constraint over the fixed key set
- [x] 1.2 Update `add_library_bag_to_trip` to copy the icon onto the trip bag
- [x] 1.3 Update `duplicate_trip` to copy the icon onto duplicated trip bags

## 2. Domain

- [x] 2.1 Add `lib/bag-icons.ts` (key set, icon map, labels, `isBagIcon`, `resolveBagIconKey`)
- [x] 2.2 Add `icon` to `ReusableBag`, `TripBag` and `BagLike` in `lib/types.ts`
- [x] 2.3 Add `validateBagIcon` and persist/validate the icon in `createBag`/`updateBag`
- [x] 2.4 Unit-test the key set, the database-constraint parity, validation and derivation

## 3. UI

- [x] 3.1 Add `components/packing/bag-icon.tsx` (explicit icon, else derived)
- [x] 3.2 Add an icon picker to the bag editor and render the icon on bag cards
- [x] 3.3 Render the bag icon in a trip's packing-list groups and the shared view

## 4. Verification

- [x] 4.1 Update fixtures/tests for the new field and add a page test for choosing an icon
- [x] 4.2 Run type-check, lint, format and unit tests
- [x] 4.3 Apply the migration to the linked database (`supabase db push`)
- [ ] 4.4 Run the integration tests against the local Supabase stack (requires Docker)
