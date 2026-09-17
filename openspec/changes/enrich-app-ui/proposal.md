## Why

The app's content surfaces were only restyled skin-deep when the Metronic shell was adopted. Trips, shared links, bags, items, the trip packing list and the public share page are all the same plain, text-only table with text buttons, a one-line "Loading..." message and a one-line empty state. The Metronic theme already in `reference/` ships a full component set for exactly this kind of data — its data table with toolbar, sorting, column visibility and pagination, plus tabs, skeletons, tooltips, badges and progress — but none of it is used on these surfaces. Pack Mate is inventory-like: rich data tables are the right pattern here, chosen per surface to fit the feature.

## What Changes

- Replace the plain table on the list surfaces (trips, bags, items, shared links) with Metronic's data-table component: toolbar with search, sortable columns, column visibility, pagination, icon actions, and per-row imagery and badges.
- Split the trip packing list into Metronic tabs (Bags / With Me / Not assigned) instead of one long scroll, and use Metronic's reorderable rows for trip entries.
- Add Metronic's skeleton loading states in place of text placeholders, and its empty-state, tooltip and breadcrumb components across the surfaces.
- Replace the hand-styled native `<select>` elements with the Metronic select component already present in the codebase.
- Restyle the public shared-trip page as a branded, read-only view of the same components.
- Add only the dependencies the copied Metronic components require.
- Copy Metronic components as written and adapt them to Pack Mate; do not invent custom components.

## Capabilities

### New Capabilities

<!-- None. The visual system capability already exists as a delta in the in-flight `adopt-metronic-ui` change. -->

### Modified Capabilities

- `design-system`: extends the visual system from the shell and landing to the app's content surfaces, requiring that each surface uses the Metronic component that fits its feature, with loading, empty, and responsive states.

## Impact

- **Frontend**: `app/(app)/trips`, `app/(app)/bags`, `app/(app)/items`, `app/(app)/shares`, `app/(app)/trip`, `app/share`, `components/layouts/page-header.tsx`, and new components ported from `reference/` into `components/ui/` and `components/`.
- **Dependencies**: only those required by the copied Metronic components (for example the data-table family's table library).
- **Tests**: page tests for trips, bags, items, trip and share updated for the new component structure; unit tests for domain logic unaffected.
- **Unchanged**: no backend, database, authentication, RLS or domain-behaviour changes.
- **Sequencing**: `design-system` is not yet in `openspec/specs/`; this change's delta is coherent only once `adopt-metronic-ui` lands (or is synced).
- **Licensing**: the template source stays gitignored; only derived application code is committed.
