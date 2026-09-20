## Why

A trip view shows what to pack but not when the trip is, how far along it is, or a quick way to focus on what is left to pack. The app already computes weight by category but presents it only as text rows, so the distribution is hard to read at a glance.

## What Changes

- Add a departure countdown to the trip view, derived from the trip's existing start and end dates: days until departure, leaving today, the current day of the trip, or that the trip has ended.
- Add a packed/unpacked filter to the trip view that composes with the existing search and category filters and, like them, does not change any entry, grouping, progress or weight.
- Render the existing weight-by-category breakdown as a chart instead of plain text rows, using the Metronic chart primitive (Recharts) and the template's chart tokens.
- Show the countdown and the weight chart on the public shared view too, so the shared read-only view matches the owner's view. The shared view does not gain the packed/unpacked filter because it has no filter UI at all.
- Add the `recharts` dependency and port the Metronic `components/ui/chart.tsx` primitive with its `--chart-1..5` tokens.
- Explicitly out of scope: weather, geocoding, timezone, destination coordinates, and any change to trip data, the database, authentication or authorisation.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `trips`: a trip view shows a departure countdown derived from its dates.
- `packing-lists`: entries can be filtered by packed state, and the weight-by-category breakdown is shown as a chart.
- `sharing`: the shared view shows the departure countdown and the weight-by-category chart.

## Impact

- **Frontend**: `app/(app)/trip/page.tsx`, `components/share/shared-trip-view.tsx`, `lib/packing.ts`, `components/packing/` (new chart and filter components), `app/globals.css`, and a new `components/ui/chart.tsx` ported from the Metronic reference.
- **Dependencies**: adds `recharts` (2.15.1, the version the Metronic reference uses). This is the project's first charting dependency; the bundle secret check is unaffected.
- **Data**: no database, migration, RLS or data-layer changes. The countdown and chart are derived from data already loaded.
- **Tests**: unit tests for the countdown states and the packed filter; component tests for the chart, its incomplete-weight state and the filter's empty state; shared-view tests for the countdown and chart.
