## Why

The topbar search is a stub that only filters three hardcoded navigation destinations, so it cannot find anything a user actually owns. Once a library holds many items, bags or trips, users have to scroll long lists to find one, and there is no way to jump from "I need my passport" to the right list.

## What Changes

- Make the topbar search dialog search the user's real data: trips, library items and library bags.
- Show matches grouped by type (Trips, Items, Bags), matched by name, case-insensitive substring. An empty query keeps showing the existing navigation destinations.
- Selecting a result opens the relevant list page filtered to that query.
- Add a search box to the Trips, Items and Bags list pages that filters the already-loaded list, with an empty state and a way to clear it.
- Search on the Items page composes with the existing category filter.
- Leave the existing within-trip entry search unchanged.

## Capabilities

### New Capabilities

- `search`: lets a user find a trip, library item or library bag by name, from a global search dialog or from the list page itself, with results grouped by type and each list page filterable by the same query.

### Modified Capabilities

<!-- None. Existing capability requirements are unchanged. -->

## Impact

- **Frontend**: `components/layouts/topbar/search-dialog.tsx` (real results), `app/(app)/trips/page.tsx`, `app/(app)/items/page.tsx`, `app/(app)/bags/page.tsx` (query-param filtering), and a shared name-matching helper alongside `searchEntries` in `lib/packing.ts`.
- **Data**: reuses existing `listTrips`, `listItems`, `listBags`; no new queries, tables, indexes or dependencies.
- **Routing**: list pages gain a `q` query parameter and, because the app is statically exported, each page's query-param use needs a `Suspense` boundary (same pattern as `app/(app)/trip/page.tsx`).
- **Coordination**: `search-dialog.tsx` is part of the in-progress `adopt-metronic-ui` change, so this work should follow or fold into it.
- **Unchanged**: no backend, database, authentication, RLS or sharing changes.
