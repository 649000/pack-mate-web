## Why

Reusing the library is the core loop, but items and bags can only be added to a trip from inside that trip, so building a list means navigating there first. Bags are templates, yet they cannot be duplicated the way trips can.

## What Changes

- Add an **Add to trip** action to each Item Library row and each Bag Library card, opening a trip picker and adding the item or bag to the chosen trip (unassigned, to be placed later).
- Add a **Duplicate** action to bag cards, copying the bag's name, icon, weight limit and default contents.

## Capabilities

### New Capabilities

<!-- None. -->

### Modified Capabilities

- `items`: an item can be added to a trip directly from the item library.
- `bags`: a bag can be added to a trip directly from the bag library, and a bag can be duplicated.

## Impact

- **Frontend**: a shared `components/add-to-trip-dialog.tsx`; the items and bags pages; a `duplicateBag` accessor in `lib/data.ts`.
- **Database**: a `duplicate_bag` function (atomic copy of a bag and its default contents, owner-checked, mirroring `duplicate_trip`).
- **Tests**: data, page and integration tests for the new actions.
