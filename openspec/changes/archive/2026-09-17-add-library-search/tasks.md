## 1. Shared matching

- [x] 1.1 Add a generic case-insensitive name matcher to `lib/packing.ts` that filters any `{ name: string }[]` by a trimmed substring, and keep `searchEntries` behaviour intact by expressing it in terms of the new helper. Verify with unit tests covering case-insensitivity, surrounding whitespace, an empty query returning the full list, and no match.
- [x] 1.2 Add a small shared list-search field component (input, clear control, and the "no matches for X" empty state) under `components/`. Verify with a component test that typing filters the rendered children and clearing restores them.

## 2. List page filtering

- [x] 2.1 Add `?q=` filtering and the search field to `app/(app)/trips/page.tsx`, wrapping the query-param use in a `Suspense` boundary as `app/(app)/trip/page.tsx` does. Verify by opening `/trips?q=<name>` and confirming only matching trips render with the query shown in the field.
- [x] 2.2 Add `?q=` filtering and the search field to `app/(app)/items/page.tsx`, composing with the existing category filter. Verify that a query and a category selected together show only items satisfying both, and that the category options do not change.
- [x] 2.3 Add `?q=` filtering and the search field to `app/(app)/bags/page.tsx`. Verify by opening `/bags?q=<name>` and confirming only matching bags render.

## 3. Global search dialog

- [x] 3.1 Extend `components/layouts/topbar/search-dialog.tsx` to fetch trips, library items and library bags when it opens and group name matches under Trips, Items and Bags, keeping the existing destinations for an empty query. Verify matches appear grouped and that a no-match query shows the empty state.
- [x] 3.2 Make selecting a result navigate to `/trips?q=`, `/items?q=` or `/bags?q=` for the matching type. Verify each type lands on its list page with the query applied.

## 4. Tests

- [x] 4.1 Add unit tests for the list filtering, including the items name-plus-category composition and the empty and no-match states. Verify with `npm run test`.
- [x] 4.2 Add or update end-to-end coverage for searching from the dialog and filtering from a list page. Verify with `npm run test:e2e`.

## 5. Verification

- [x] 5.1 Run `npm run typecheck`, `npm run lint` and `npm run format:check` and confirm they pass.
- [x] 5.2 Run `npm run build` and confirm the static export succeeds, which also catches any missing `Suspense` boundary around `useSearchParams`.
- [x] 5.3 Run `npm run test:coverage` and confirm the coverage threshold is still met.
