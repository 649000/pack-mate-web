## Why

Every bag currently shares one generic icon, so a user cannot tell their camera bag from their toiletry bag at a glance. Bags already have identity in the user's mind; the interface should let them express it and persist it.

## What Changes

- Add an optional **bag icon**, chosen from a fixed set, to library bags in the bag editor.
- **Persist** it: a nullable `icon` column on `reusable_bags` and `trip_bags`, constrained to the known keys.
- **Copy** the icon when a library bag is added to a trip and when a trip is duplicated.
- When no icon is chosen, **derive** one from the bag's contents and otherwise show a generic icon.
- Render the icon in the bag library, a trip's packing-list groups and the public shared view.

## Capabilities

### New Capabilities

<!-- None. -->

### Modified Capabilities

- `bags`: a bag can carry a chosen icon that is persisted and copied onto trip bags.

## Impact

- **Database**: new migration adding `icon` to `reusable_bags` and `trip_bags`; updated `add_library_bag_to_trip` and `duplicate_trip` functions.
- **Frontend/domain**: `lib/bag-icons.ts`, `lib/types.ts`, `lib/validation.ts`, `lib/data.ts`; the bag library editor/cards, the trip packing list and the shared view.
- **Tests**: unit tests for the icon key set (including a check that it matches the database constraint), derivation, and validation; page tests for choosing an icon.
