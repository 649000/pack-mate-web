## 1. Database

- [x] 1.1 Add `supabase/migrations/20260915000000_item_metadata.sql` adding nullable `description`, `link`, `image_url` to `packmate.reusable_items` and `packmate.trip_entries`, with http(s) checks on `link`/`image_url` and a length check on `description`; verify the migration applies cleanly to a local Supabase instance
- [x] 1.2 Update `packmate.add_library_item_to_trip` to select and insert the three new columns; verify by adding an item with details to a trip and reading the resulting entry
- [x] 1.3 Update `packmate.add_library_bag_to_trip` to copy the three new columns into the copied entries; verify by adding a bag whose default contents carry details

## 2. Domain types and validation

- [x] 2.1 Add `description`, `link`, `image_url` to `ReusableItem` and `TripEntry` in `lib/types.ts`; verify with `npm run typecheck`
- [x] 2.2 Add `validateOptionalUrl` and `validateOptionalDescription` (with a shared maximum-length constant) to `lib/validation.ts`, rejecting non-http(s) URLs and over-long descriptions; verify unit tests in `lib/validation.test.ts`

## 3. Data access

- [x] 3.1 Extend `createItem` and `updateItem` in `lib/data.ts` to accept and validate the three fields; verify via `lib/data.test.ts`
- [x] 3.2 Extend the `updateEntry` patch in `lib/data.ts` to allow the three fields; verify that updating an entry never writes to `reusable_items`

## 4. Search and location helpers

- [x] 4.1 Add `entryLocationLabel(entry, bags)` to `lib/packing.ts` returning the bag name, `With Me`, or an unassigned label; verify unit tests in `lib/packing.test.ts`
- [x] 4.2 Add `searchEntries(entries, query)` to `lib/packing.ts` doing a case-insensitive name substring match, returning all entries for an empty query; verify unit tests in `lib/packing.test.ts`

## 5. UI - item library

- [x] 5.1 Add description, link, and image URL inputs to create and edit in `app/(app)/items/page.tsx`, rendering a thumbnail with an `alt` fallback and a link opened with `rel="noopener noreferrer"`; verify with `app/(app)/items/page.test.tsx` and a manual mobile-width check

## 6. UI - trip view

- [x] 6.1 Add a search input to `app/(app)/trip/page.tsx` that filters loaded entries and shows each match's location label, with an empty-result state and a clear reset; verify with `app/(app)/trip/page.test.tsx`
- [x] 6.2 Render entry description, link, and image (expandable, mobile-first) and allow editing entry details without changing the library item; verify with `app/(app)/trip/page.test.tsx`

## 7. Verification

- [x] 7.1 Extend `tests/integration/rls.test.ts` to assert that item details copy onto the trip entry on add, and that a second user cannot read the first user's items or entries
- [x] 7.2 Extend the authenticated e2e spec to add item metadata, search for the item in a trip, and see its location
- [x] 7.3 Run `npm run verify` and confirm typecheck, lint, format, unit tests, build, and bundle checks pass
