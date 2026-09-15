## Why

Items and bags are the only way a list is organised today: bags answer "where is it?" but nothing answers "what kind of thing is it?". A growing reusable library becomes hard to browse, With Me and unassigned entries have no grouping at all, and a traveller cannot sanity-check a list by kind ("have I packed any clothing?"). A fixed category set adds a lightweight second lens without introducing a second container hierarchy.

## What Changes

- Add an **optional category** from a **fixed set** to reusable items, copied onto trip entries when the item is added to a trip, exactly like description, link, image and weight.
- A fixed set of 20 everyday-travel categories, grouped in the picker but stored flat. `null` means uncategorised; there is no "Other" bucket.
- Show a **category badge** on library items, trip entries and shared entries.
- Add a **category filter** to the library and the trip view. Filters show only the categories present in the current list.
- Add a **weight-by-category breakdown** to the trip view, covering the whole list (including With Me and unassigned entries), clearly labelled so it is not confused with the existing baggage total.
- Show categories and the weight-by-category breakdown on the **public shared view**.
- Bags are unchanged: the bag tree remains the only structural, draggable hierarchy. Category is an attribute and a filter, never a grouping that replaces a bag.
- **BREAKING** (behavioral): the shared payload's projection version moves from `v: 1` to `v: 2` to signal the added field.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `items`: reusable items gain an optional, validated, fixed-set category that is set on create and edit.
- `packing-lists`: trip entries carry a copied category; the trip view can filter entries by category and shows a weight-by-category breakdown of the whole list.
- `sharing`: the shared view shows each entry's category and the weight-by-category breakdown.

## Impact

- **Database**: new migration adding nullable `category text` with a check constraint to `packmate.reusable_items` and `packmate.trip_entries`. No RLS change, no backfill.
- **Database functions**: `add_library_bag_to_trip` and `add_library_item_to_trip` copy the new column; `get_shared_trip` adds `category` to its explicit projection and bumps `v` to 2.
- **Code**: `lib/types.ts`, `lib/validation.ts`, `lib/data.ts`, `lib/packing.ts`, `lib/weight.ts`, `app/(app)/items/page.tsx`, `app/(app)/trip/page.tsx`, `components/share/shared-trip-view.tsx`.
- **Dependencies**: none.
- **Cost**: none; the share payload grows by one nullable string per entry.
- **Sequencing**: touches the same files as the in-flight `public-share-links` change, so it should land after that change is archived or be rebased on it.
