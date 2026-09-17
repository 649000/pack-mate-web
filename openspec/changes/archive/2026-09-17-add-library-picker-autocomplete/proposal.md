## Why

Selecting a library item or bag into a trip is a core, repeated action, but the pickers are native `<select>` dropdowns. As a library grows they become a scroll hunt: the control matches on prefix only, offers no way to tell similarly named entries apart, and is awkward on a phone. A user who thinks "I need to pack my passport" should be able to type "pass" and pick it.

## What Changes

- Replace the library pickers with a searchable picker: typing filters the choices by a case-insensitive substring of the name, matching anywhere in the name rather than only at the start.
- Apply it wherever a library item or library bag is selected:
  - adding a library bag to a trip,
  - adding a library item to a trip,
  - adding a library item to a bag's default contents.
- Support keyboard operation (move through matches, confirm, dismiss) and touch, with a no-match state and an empty-library state.
- Keep the effect of a selection exactly as it is today: the same rows are copied with the same default quantity, contents and weight. No data, schema or authorisation changes.

## Capabilities

### New Capabilities

- `library-picker`: a user chooses one of their own library items or bags by typing, wherever a library item or bag is selected into a trip or a bag's default contents, without changing what the selection produces.

### Modified Capabilities

<!-- None. The affected requirements in `packing-lists` and `bags` describe what is
     selected and what it produces, not the control used to select it, so their
     behaviour is unchanged. -->

## Impact

- **Frontend**: `app/(app)/trip/page.tsx` (add bag, add item) and `app/(app)/bags/page.tsx` (default contents), plus a new reusable picker component under `components/`.
- **Dependencies**: none expected. The existing `radix-ui` Popover primitive and `filterByName` in `lib/packing.ts` cover the need; a new dependency would need justification.
- **Tests**: component and unit tests for the picker and its filtering; existing page tests updated where they interact with the pickers; end-to-end coverage of selecting a library item and bag by typing.
- **Unchanged**: no backend, database, authentication, RLS or spec-level behaviour of trips, items, bags or packing lists.
