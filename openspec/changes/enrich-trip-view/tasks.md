## 1. Chart dependency and primitive

- [x] 1.1 Add `recharts` (2.15.1) to `package.json` and install; verify `npm install` succeeds and the version matches the Metronic reference
- [x] 1.2 Port `components/ui/chart.tsx` from the Metronic reference unchanged; verify it type-checks with `npm run typecheck`
- [x] 1.3 Add `--chart-1..5` tokens to `:root` and `.dark` in `app/globals.css`, matching the reference; verify the values match `reference/metronic-tailwind-react-starter-kit/typescript/nextjs/styles/globals.css`

## 2. Departure countdown

- [x] 2.1 Add a pure `departureCountdown(startDate, endDate, now)` helper returning `none | before | today | inProgress | ended`, with local-calendar day arithmetic; verify unit tests cover every state and a non-UTC time zone
- [x] 2.2 Render the countdown in the trip view's existing progress card; verify each state shows the expected label by hand or component test
- [x] 2.3 Render the countdown in the shared view near the trip dates, using the same helper; verify the shared-view test shows it when a start date is set and omits it when absent

## 3. Packed filter

- [x] 3.1 Add `PackedFilter` and `filterEntriesByPacked` to `lib/packing.ts`; verify unit tests cover all, packed and unpacked
- [x] 3.2 Add a packed-state chip row matching `CategoryFilterChips`, and apply the filter after search and category but before `groupEntries`; verify filtering changes neither grouping nor progress nor weight totals
- [x] 3.3 Add the empty result state for a packed state with no matches; verify it renders distinctly from the search and category empty states

## 4. Weight-by-category chart

- [x] 4.1 Build `components/packing/weight-by-category-chart.tsx` as a `"use client"` horizontal bar chart fed by `weightByCategory`, with a labelled bar and formatted weight per category; verify a component test renders one bar per category
- [x] 4.2 Mark incomplete categories with a muted bar and the "(incomplete)" marker; verify a test shows the marker when a counted entry has no weight
- [x] 4.3 Replace the text rows in the trip view's "Weight by category" card with the chart; verify the trip page renders the chart
- [x] 4.4 Replace the text rows in the shared view's "Weight by category" card with the chart while keeping the shared view a server component; verify `npm run build` (static export) succeeds

## 5. Verification

- [x] 5.1 Run `npm run verify` (typecheck, lint, format, unit tests, build, bundle check) and confirm it passes
- [x] 5.2 Check the countdown, filter and chart on a small viewport and confirm mobile layout; verify no horizontal overflow and the chart labels remain readable
- [x] 5.3 Run `openspec validate enrich-trip-view --strict` and confirm the change is valid
