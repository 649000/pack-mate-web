## Why

Travellers pack many items across several bags and cannot remember which bag holds a given item, especially once bags are closed and stowed. The trip view only groups items by bag, so locating one item means scanning every bag. Items also carry no supporting detail (what it is, which model, what it looks like), which makes items easy to confuse.

## What Changes

- Add an item-first search to the trip view: type a name and see the matching trip entries with their location (a bag, With Me, or unassigned).
- Add optional `description`, `link`, and `image_url` to reusable items, and copy them onto trip entries when added to a trip.
- Validate `link` and `image_url` as `http(s)` URLs and cap description length.
- Keep bags as physical containers; no `bags` to `categories` rename.
- No weight, worn, consumable, or star in this change.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `items`: reusable items gain optional description, link, and image URL, settable on create and edit.
- `packing-lists`: trip entries carry copies of item description, link, and image URL; the trip view supports finding an entry by name and showing its location.

## Impact

- Database: new nullable columns on `packmate.reusable_items` and `packmate.trip_entries`; both copy RPCs updated. RLS unchanged.
- Code: `lib/types.ts`, `lib/data.ts`, `lib/packing.ts`, `lib/validation.ts`, `app/(app)/items/page.tsx`, `app/(app)/trip/page.tsx`.
- Tests: unit (validation, search/location), integration (metadata copy), e2e (search and metadata persistence).
- No new dependencies, no backend service, no cost change.
