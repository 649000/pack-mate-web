## Why

Weight is a core part of the product, but a trip's packing rows show only group totals. The per-item weight the user entered is not visible where they actually pack.

## What Changes

- Show each packing-list entry's weight in its row when it has one, in the user's chosen unit.

## Capabilities

### New Capabilities

<!-- None. -->

### Modified Capabilities

- `packing-lists`: packing-list entries show their weight.

## Impact

- **Frontend**: the trip screen (`SortableEntry`, `EntryGroup`).
- **Tests**: a page test asserting the entry weight is shown.
