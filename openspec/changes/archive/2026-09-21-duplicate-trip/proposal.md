## Why

Travellers repeat similar trips: an annual holiday, a regular work trip, the same weekend bag. Today every new trip starts empty, so reusing a proven packing list means re-adding every bag and item by hand. Reuse should be fast.

## What Changes

- Add a **Duplicate** action to a trip, available from the trips list and the trip page header.
- Duplicating prompts for the new trip's trip-level fields — name, country, destination, start date and end date — with the source trip's name, country and destination prefilled and the dates left blank.
- On confirmation, create the new trip from those values and copy the source trip's packing list: its bags (including nesting and weight limits) and its entries (name, quantity, With Me, position, description, link, image URL, weight and category).
- Every copied entry starts **unpacked**. Packed state and share links are not copied.
- The copy is independent: later edits to either trip do not affect the other.
- The whole operation is atomic: cancelling or failing creates nothing.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `trips`: add the ability to duplicate one of the user's own trips, prompting for the new trip's trip-level fields and copying the source trip's packing list.

## Impact

- Database: new `duplicate_trip` function (security invoker) that copies `trip_bags` (remapping `parent_bag_id`) and `trip_entries`.
- Code: `lib/data.ts` (duplicate function), `app/(app)/trips/page.tsx` (row action), `app/(app)/trip/page.tsx` (header action and dialog).
- Tests: unit for copy/remap helpers, RLS integration (a second user cannot duplicate another user's trip), and the authenticated e2e flow.
- No new dependencies; no cost change.
