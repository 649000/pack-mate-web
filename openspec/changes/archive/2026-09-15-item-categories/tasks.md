## 1. Database

- [x] 1.1 Add migration `supabase/migrations/20260915040000_item_categories.sql` adding nullable `category text` to `packmate.reusable_items` and `packmate.trip_entries`, each with a check constraint limited to the 20 keys (`documents`, `valuables`, `health`, `clothing`, `footwear`, `swim_beach`, `formal`, `toiletries`, `comfort`, `electronics`, `work_study`, `entertainment`, `sports`, `gear`, `food`, `laundry`, `baby_kids`, `pets`, `religious`, `accessibility`); verify the migration applies cleanly in the integration test environment
- [x] 1.2 `create or replace` `packmate.add_library_bag_to_trip` and `packmate.add_library_item_to_trip` to insert `category`; verify an item-add and a bag-add test shows the category copied
- [x] 1.3 `create or replace` `packmate.get_shared_trip` to add `'category', e.category` to the entry projection and bump `'v'` to `2`; verify the share data test returns `category`

## 2. Types and validation

- [x] 2.1 Add `ItemCategory` union and `category: ItemCategory | null` to `ReusableItem`, `TripEntry`, `SharedTripEntry` and `EntryLike` in `lib/types.ts`; verify `npm run typecheck` passes
- [x] 2.2 Add `ITEM_CATEGORIES` and `validateCategory` (null allowed, unknown rejected) to `lib/validation.ts`; verify unit tests cover each key, `null`, and an unknown value
- [x] 2.3 Add a test asserting `ITEM_CATEGORIES` matches the values allowed by the SQL check constraint; verify it fails if either list changes

## 3. Data layer

- [x] 3.1 Thread `category` through `validateItemDetails`, `createItem`, `updateItem` and `updateEntry` in `lib/data.ts`; verify `lib/data.test.ts` covers set, change, clear and unknown-rejection
- [x] 3.2 Verify the library copy semantics with a test: changing a trip entry's category leaves the source library item unchanged

## 4. Helpers

- [x] 4.1 Add `filterEntriesByCategory(entries, category)` to `lib/packing.ts`; verify unit tests cover a selected category, uncategorised and no match
- [x] 4.2 Add `weightByCategory(entries)` to `lib/weight.ts` summing unit weight × quantity over the whole list, grouping `null` as uncategorised and reporting incompleteness; verify unit tests cover multiple categories, With Me and unassigned entries, uncategorised, and a missing weight

## 5. Library UI

- [x] 5.1 Add a grouped category select to the item create/edit dialog in `app/(app)/items/page.tsx`; verify a component test sets and clears a category
- [x] 5.2 Show a category badge on library item rows; verify the item page test renders the badge
- [x] 5.3 Add category filter chips offering only categories in use plus uncategorised; verify a component test filters, clears, and shows the empty state

## 6. Trip UI

- [x] 6.1 Show a category badge on each trip entry in `app/(app)/trip/page.tsx`; verify the trip page test renders it
- [x] 6.2 Add category filter chips to the trip view without affecting bag, With Me or unassigned grouping; verify a component test filters across locations, clears, and shows the empty state
- [x] 6.3 Add a "Weight by category" card labelled as the whole list and kept distinct from the baggage total; verify a component test renders the breakdown and its incomplete state

## 7. Shared view

- [x] 7.1 Show category badges and the weight-by-category breakdown in `components/share/shared-trip-view.tsx`, keeping the view read-only; verify `components/share/shared-trip-view.test.tsx` covers categorised, uncategorised and incomplete cases

## 8. Integration and verification

- [x] 8.1 Add an integration test asserting a second user cannot read another user's categorised reusable items or trip entries; verify `npm run test:integration` passes
- [x] 8.2 Add a share test asserting the payload contains `category`, contains no owner or library identifiers, and reports `v: 2`
- [x] 8.3 Run `npm run verify` and confirm typecheck, lint, format, unit tests, build and bundle check all pass
