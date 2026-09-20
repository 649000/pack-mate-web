## Context

See `proposal.md` — Why.

The trip view (`app/(app)/trip/page.tsx`) is a client component that loads a trip, its bags and entries from Supabase and derives everything client-side through `lib/packing.ts` and `lib/weight.ts`. Progress, grouping and the category breakdown are all pure functions of the loaded rows.

The shared view (`components/share/shared-trip-view.tsx`) is a server component rendered from a static export; it receives the trip payload and calls the same pure helpers.

The project already adopted the Metronic token base and UI primitives, but the template's chart primitive was never ported and no charting dependency exists. The Metronic reference (`reference/metronic-tailwind-react-starter-kit/typescript/nextjs`) ships `components/ui/chart.tsx` (a shadcn primitive over Recharts) plus `--chart-1..5` tokens; it has no ApexCharts React component, only the dependency and a stylesheet.

## Goals / Non-Goals

**Goals:**

- Derive the countdown, packed filter and chart entirely from data already loaded, with no data-layer or schema change.
- Follow the Metronic chart primitive and tokens rather than inventing a chart style.
- Keep the shared view a server component; isolate client-only chart code behind a component boundary.

**Non-Goals:**

- Weather, geocoding, timezone or destination coordinates.
- Per-category colours or interactive chart features (zoom, drill-down, series toggles).
- Any change to trip dates, entries, the database, authentication or authorisation.
- The packed filter on the shared view (it has no filter UI).

## Decisions

### Use Recharts through the Metronic chart primitive

**Why:** the reference's only chart component is `components/ui/chart.tsx` built on Recharts, so porting it is the faithful "same style" path and reuses the shadcn primitive pattern already used across `components/ui`. Add `recharts` at the reference's version (2.15.1) and the reference's `--chart-1..5` tokens to `:root` and `.dark` in `app/globals.css`. The primitive's `ChartStyle` injects `--color-<key>` from the chart config, so no `@theme` mapping is required; the chart config points its series at `var(--chart-1)`.

**Alternatives:** ApexCharts is a Metronic dependency but has no React component in the reference, so adopting it means hand-building a wrapper with nothing to follow. Hand-rolled Tailwind/SVG bars would avoid the dependency but diverge from the Metronic style the user asked for. Rejected both.

### Countdown is a pure helper using local-calendar date arithmetic

**Why:** a user-facing "days until departure" must match the viewer's calendar day. Parse each `YYYY-MM-DD` into its parts and build a UTC day number (`Date.UTC(y, m-1, d)`), derive "today" from the viewer's local date parts, and difference the day numbers. This yields local-calendar semantics without DST off-by-one, and stays a pure, unit-testable function.

**Alternative:** reuse the `T00:00:00Z` parsing used by `validateBirthday` (`lib/validation.ts:219`). Rejected for display: it treats "today" as the UTC day, so the countdown is off by one for part of the day in any non-UTC zone. Destination-local time is out of scope (needs geocoding).

The helper returns a discriminated union — `none | before(days) | today | inProgress(day, total | null) | ended` — so presentation stays in the component and edge cases stay in the helper.

### Packed filter is a pure predicate composed before grouping

**Why:** it mirrors the existing category filter exactly, which the `packing-lists` spec already constrains: filtering must not change entries, grouping, progress or weight. Add `PackedFilter` and `filterEntriesByPacked` to `lib/packing.ts` and apply it after search and category, before `groupEntries`. Progress and weight continue to be computed from the unfiltered `entries`.

### Filter UI mirrors the existing category chips

**Why:** `CategoryFilterChips` establishes the pattern — `Button` chips, `primary`/`outline`, `aria-pressed`, and keeping the selected chip visible after its last entry disappears. A matching `All / To pack / Packed` chip row in the trip toolbar is the smallest, most consistent addition.

**Alternative:** a segmented control or `Tabs`. Rejected: `Tabs` implies switching content panels, and there is no segmented primitive in the design system.

### The chart is an isolated client component

**Why:** Recharts is client-only. Put it in `components/packing/weight-by-category-chart.tsx` with `"use client"` and import it from both the trip page (already a client component) and the shared view. The shared view stays a server component; only the chart crosses the boundary.

Render a horizontal bar chart (`BarChart layout="vertical"`): category on the Y axis, weight on the X axis, value in the tooltip and as a text label, and an explicit height derived from the row count rather than the primitive's default `aspect-video`. A donut was rejected: up to 20 categories are unreadable and unlabellable on mobile.

### Incomplete weights stay visible in the chart

**Why:** `weightByCategory` marks a category `complete: false` when any counted entry lacks a weight (`lib/weight.ts:115`). A chart that hides this would overstate the distribution. Render incomplete rows with a muted bar and the existing "(incomplete)" marker, using a per-row `Cell`. Hiding incomplete rows was rejected as misleading.

### Placement

- Trip page: countdown in the existing progress/status card; the chart replaces the plain text rows inside the "Weight by category" card.
- Shared view: countdown near the trip dates; chart inside the existing "Weight by category" card.
- Packed filter: trip page only.

## Risks / Trade-offs

- **Recharts adds bundle weight** → accepted, consistent with `adopt-metronic-ui` ("port faithfully; accept bundle weight"); the bundle check is a secret scan, and the chart is a client-only chunk.
- **Static export plus a client-only chart** → keep the chart behind a `"use client"` component and verify `npm run build` (the export) succeeds.
- **Countdown depends on the viewer's clock and time zone** → deliberately local-calendar; a device with a wrong date shows a wrong countdown, which is acceptable for a derived label.
- **Malformed dates (for example an end date before the start date)** → the helper returns a sane state rather than throwing, so the view never breaks on bad data.
- **Chart accessibility** → do not rely on colour alone: each bar carries a category label and its formatted weight as text, and the chart container exposes an accessible name.

## Migration Plan

No data migration and no persisted state. Add the dependency and tokens, port the primitive, add the pure helpers, wire the two views, and cover them with tests. Rollback is reverting the change.

## Open Questions

- Whether the countdown should also appear in the trips list is deferred; it is out of scope for this change.
